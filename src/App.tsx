/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Chat, Message, StatusUpdate, ActiveCall } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { NewChatModal } from './components/NewChatModal';
import { NewGroupModal } from './components/NewGroupModal';
import { GroupInfoModal } from './components/GroupInfoModal';
import { StatusViewer } from './components/StatusViewer';
import { NewStatusModal } from './components/NewStatusModal';
import { CallModal } from './components/CallModal';
import { IncomingCallBanner } from './components/IncomingCallBanner';
import { soundEffects } from './utils/audio';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('wa_token'));
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statuses, setStatuses] = useState<StatusUpdate[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('wa_theme') as 'dark' | 'light') || 'dark';
  });

  // Active call state
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
    callerAvatar: string;
    callType: 'voice' | 'video';
    offer: any;
    chatId: string;
  } | null>(null);

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showNewStatus, setShowNewStatus] = useState(false);
  const [statusViewerData, setStatusViewerData] = useState<StatusUpdate[] | null>(null);

  // Realtime typing indicators: chatId -> [userIds]
  const [typingMap, setTypingMap] = useState<Record<string, string[]>>({});

  // Mobile layout state
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar');

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callTimerRef = useRef<any>(null);

  const isDark = theme === 'dark';

  // Apply theme class
  useEffect(() => {
    localStorage.setItem('wa_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Load current user
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('wa_token');
      if (savedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data.user);
            setToken(savedToken);
          } else {
            localStorage.removeItem('wa_token');
            setToken(null);
          }
        } catch {
          // Fallback or retry
        }
      } else {
        // Default login as Demo Alex so the app is instantly active and enjoyable
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'alex@whatsapp.io', password: 'password123' }),
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data.user);
            setToken(data.token);
            localStorage.setItem('wa_token', data.token);
          }
        } catch {}
      }
    };
    initAuth();
  }, []);

  // Fetch directory, chats, and statuses
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [usersRes, chatsRes, statusesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/chats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/statuses', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setAllUsers(data.users);
      }
      if (chatsRes.ok) {
        const data = await chatsRes.json();
        setChats(data.chats);
        // Default select first chat on wide screen if none selected
        if (!activeChatId && data.chats.length > 0 && window.innerWidth > 768) {
          setActiveChatId(data.chats[0].id);
        }
      }
      if (statusesRes.ok) {
        const data = await statusesRes.json();
        setStatuses(data.statuses);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, [token, activeChatId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChatId || !token) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chats/${activeChatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();

    // Mark messages as read via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN && currentUser) {
      wsRef.current.send(
        JSON.stringify({
          type: 'read_messages',
          chatId: activeChatId,
          userId: currentUser.id,
        })
      );
    }
  }, [activeChatId, token, currentUser]);

  // WebSocket Connection & Real-time Event Listener
  useEffect(() => {
    if (!currentUser) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', userId: currentUser.id }));
    };

    ws.onmessage = async event => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'new_message': {
            const { message } = data;
            // If belongs to current active chat, append
            if (message.chatId === activeChatId) {
              setMessages(prev => {
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
              });
              // Mark as read immediately if current user is viewing
              if (message.senderId !== currentUser.id) {
                soundEffects.playMessageReceived();
                ws.send(
                  JSON.stringify({
                    type: 'read_messages',
                    chatId: activeChatId,
                    userId: currentUser.id,
                  })
                );
              }
            } else {
              // Different chat: play chime and increment unread
              if (message.senderId !== currentUser.id) {
                soundEffects.playMessageReceived();
              }
            }
            // Update chat preview list
            setChats(prev =>
              prev.map(c =>
                c.id === message.chatId
                  ? {
                      ...c,
                      lastMessage: message,
                      updatedAt: message.createdAt,
                      unreadCount:
                        c.id === activeChatId || message.senderId === currentUser.id
                          ? 0
                          : (c.unreadCount || 0) + 1,
                    }
                  : c
              )
            );
            break;
          }

          case 'message_edited': {
            setMessages(prev =>
              prev.map(m =>
                m.id === data.messageId
                  ? { ...m, content: data.newContent, isEdited: true }
                  : m
              )
            );
            break;
          }

          case 'message_deleted': {
            setMessages(prev => {
              if (data.forEveryone) {
                return prev.map(m =>
                  m.id === data.messageId
                    ? { ...m, deletedForEveryone: true, content: 'This message was deleted' }
                    : m
                );
              } else {
                return prev.filter(m => m.id !== data.messageId || data.userId !== currentUser.id);
              }
            });
            break;
          }

          case 'message_reaction': {
            setMessages(prev =>
              prev.map(m =>
                m.id === data.messageId ? { ...m, reactions: data.reactions } : m
              )
            );
            break;
          }

          case 'messages_read': {
            if (data.chatId === activeChatId) {
              setMessages(prev =>
                prev.map(m =>
                  m.senderId === currentUser.id ? { ...m, status: 'read' } : m
                )
              );
            }
            break;
          }

          case 'message_pinned': {
            setMessages(prev =>
              prev.map(m =>
                m.id === data.messageId ? { ...m, isPinned: data.isPinned } : m
              )
            );
            break;
          }

          case 'typing': {
            const { chatId, userId, isTyping } = data;
            setTypingMap(prev => {
              const currentList = prev[chatId] || [];
              if (isTyping) {
                if (!currentList.includes(userId)) {
                  return { ...prev, [chatId]: [...currentList, userId] };
                }
              } else {
                return { ...prev, [chatId]: currentList.filter(id => id !== userId) };
              }
              return prev;
            });
            break;
          }

          case 'presence': {
            setAllUsers(prev =>
              prev.map(u =>
                u.id === data.userId
                  ? { ...u, isOnline: data.isOnline, lastSeen: data.lastSeen }
                  : u
              )
            );
            break;
          }

          case 'status_created': {
            setStatuses(prev => [data.status, ...prev]);
            break;
          }

          case 'status_deleted': {
            setStatuses(prev => prev.filter(s => s.id !== data.statusId));
            break;
          }

          case 'chat_created':
          case 'chat_updated': {
            fetchData();
            break;
          }

          case 'system_reset': {
            fetchData();
            break;
          }

          // WebRTC Signaling events
          case 'incoming_call': {
            soundEffects.startRinging();
            setIncomingCall({
              callerId: data.fromUserId,
              callerName: data.fromUserName,
              callerAvatar: data.fromUserAvatar,
              callType: data.callType,
              offer: data.offer,
              chatId: data.chatId,
            });
            break;
          }

          case 'call_answered': {
            soundEffects.stopRinging();
            if (peerConnectionRef.current && data.answer) {
              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(data.answer)
              );
              setActiveCall(prev => (prev ? { ...prev, status: 'connected' } : null));
              // Start elapsed timer
              clearInterval(callTimerRef.current);
              callTimerRef.current = setInterval(() => {
                setActiveCall(prev => (prev ? { ...prev, duration: prev.duration + 1 } : null));
              }, 1000);
            }
            break;
          }

          case 'call_ice_candidate': {
            if (peerConnectionRef.current && data.candidate) {
              try {
                await peerConnectionRef.current.addIceCandidate(
                  new RTCIceCandidate(data.candidate)
                );
              } catch (e) {
                console.error('Error adding ICE candidate:', e);
              }
            }
            break;
          }

          case 'call_rejected': {
            soundEffects.stopRinging();
            soundEffects.playCallEnded();
            cleanupCall();
            break;
          }

          case 'call_ended': {
            soundEffects.stopRinging();
            soundEffects.playCallEnded();
            cleanupCall();
            break;
          }
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [currentUser, activeChatId, fetchData]);

  // WebRTC Cleanup
  const cleanupCall = useCallback(() => {
    soundEffects.stopRinging();
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (activeCall?.localStream) {
      activeCall.localStream.getTracks().forEach(t => t.stop());
    }
    setActiveCall(null);
    setIncomingCall(null);
  }, [activeCall]);

  // Start outgoing call
  const handleStartCall = async (callType: 'voice' | 'video') => {
    if (!activeChatId || !currentUser) return;
    const currentChat = chats.find(c => c.id === activeChatId);
    if (!currentChat) return;

    const targetUserId = currentChat.participants.find(p => p !== currentUser.id);
    const targetUser = allUsers.find(u => u.id === targetUserId);
    if (!targetUser) {
      alert('Calls are only available in direct 1-to-1 conversations.');
      return;
    }

    try {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      // Get user media
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });

      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      const remoteStream = new MediaStream();
      pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => {
          remoteStream.addTrack(track);
        });
      };

      pc.onicecandidate = event => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'call_ice',
              toUserId: targetUser.id,
              fromUserId: currentUser.id,
              candidate: event.candidate,
            })
          );
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setActiveCall({
        callId: `call_${Date.now()}`,
        chatId: activeChatId,
        otherUser: {
          id: targetUser.id,
          name: targetUser.name,
          avatar: targetUser.avatar,
        },
        type: callType,
        direction: 'outgoing',
        status: 'ringing',
        duration: 0,
        isMuted: false,
        isVideoOff: false,
        localStream,
        remoteStream,
        peerConnection: pc,
      });

      // Send offer to target user
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'call_offer',
            toUserId: targetUser.id,
            fromUserId: currentUser.id,
            fromUserName: currentUser.name,
            fromUserAvatar: currentUser.avatar,
            callType,
            offer,
            chatId: activeChatId,
          })
        );
      }
    } catch (err: any) {
      alert(`Could not access media devices: ${err.message}. Please check browser permissions.`);
      cleanupCall();
    }
  };

  // Accept incoming call
  const handleAcceptCall = async () => {
    if (!incomingCall || !currentUser) return;
    soundEffects.stopRinging();

    try {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.callType === 'video',
      });

      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      const remoteStream = new MediaStream();
      pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => {
          remoteStream.addTrack(track);
        });
      };

      pc.onicecandidate = event => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'call_ice',
              toUserId: incomingCall.callerId,
              fromUserId: currentUser.id,
              candidate: event.candidate,
            })
          );
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      setActiveCall({
        callId: `call_${Date.now()}`,
        chatId: incomingCall.chatId,
        otherUser: {
          id: incomingCall.callerId,
          name: incomingCall.callerName,
          avatar: incomingCall.callerAvatar,
        },
        type: incomingCall.callType,
        direction: 'incoming',
        status: 'connected',
        duration: 0,
        isMuted: false,
        isVideoOff: false,
        localStream,
        remoteStream,
        peerConnection: pc,
      });

      setIncomingCall(null);

      // Send answer to caller
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'call_answer',
            toUserId: incomingCall.callerId,
            fromUserId: currentUser.id,
            answer,
          })
        );
      }

      // Start duration timer
      clearInterval(callTimerRef.current);
      callTimerRef.current = setInterval(() => {
        setActiveCall(prev => (prev ? { ...prev, duration: prev.duration + 1 } : null));
      }, 1000);
    } catch (err: any) {
      alert(`Could not start media stream: ${err.message}`);
      handleDeclineCall();
    }
  };

  // Decline incoming call
  const handleDeclineCall = () => {
    soundEffects.stopRinging();
    if (incomingCall && currentUser && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'call_reject',
          toUserId: incomingCall.callerId,
          fromUserId: currentUser.id,
          reason: 'declined',
          chatId: incomingCall.chatId,
          callType: incomingCall.callType,
        })
      );
    }
    setIncomingCall(null);
  };

  // End active call
  const handleEndCall = () => {
    if (activeCall && currentUser && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'call_end',
          toUserId: activeCall.otherUser.id,
          fromUserId: currentUser.id,
          duration: activeCall.duration,
          chatId: activeCall.chatId,
          callType: activeCall.type,
        })
      );
    }
    cleanupCall();
  };

  const handleToggleMute = () => {
    if (!activeCall?.localStream) return;
    const audioTrack = activeCall.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setActiveCall({ ...activeCall, isMuted: !audioTrack.enabled });
    }
  };

  const handleToggleVideo = () => {
    if (!activeCall?.localStream) return;
    const videoTrack = activeCall.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setActiveCall({ ...activeCall, isVideoOff: !videoTrack.enabled });
    }
  };

  // Send message
  const handleSendMessage = (msgData: {
    type: 'text' | 'image' | 'audio' | 'video' | 'document';
    content: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    fileType?: string;
    duration?: number;
    replyTo?: any;
  }) => {
    if (!activeChatId || !currentUser || !wsRef.current) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      chatId: activeChatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      type: msgData.type,
      content: msgData.content,
      fileUrl: msgData.fileUrl,
      fileName: msgData.fileName,
      fileSize: msgData.fileSize,
      fileType: msgData.fileType,
      duration: msgData.duration,
      replyTo: msgData.replyTo,
      reactions: {},
      status: 'sent',
      readBy: [],
      deliveredTo: [],
      createdAt: new Date().toISOString(),
    };

    wsRef.current.send(
      JSON.stringify({
        type: 'send_message',
        message: newMessage,
      })
    );
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!activeChatId || !wsRef.current) return;
    wsRef.current.send(
      JSON.stringify({
        type: 'edit_message',
        messageId,
        chatId: activeChatId,
        newContent,
      })
    );
  };

  const handleDeleteMessage = (messageId: string, forEveryone: boolean) => {
    if (!activeChatId || !currentUser || !wsRef.current) return;
    wsRef.current.send(
      JSON.stringify({
        type: 'delete_message',
        messageId,
        chatId: activeChatId,
        forEveryone,
        userId: currentUser.id,
      })
    );
  };

  const handleReactMessage = (messageId: string, emoji: string) => {
    if (!activeChatId || !currentUser || !wsRef.current) return;
    wsRef.current.send(
      JSON.stringify({
        type: 'react_message',
        messageId,
        chatId: activeChatId,
        emoji,
        userId: currentUser.id,
      })
    );
  };

  const handlePinMessage = (messageId: string, isPinned: boolean) => {
    if (!activeChatId || !wsRef.current) return;
    wsRef.current.send(
      JSON.stringify({
        type: 'pin_message',
        messageId,
        chatId: activeChatId,
        isPinned,
      })
    );
  };

  const handleTyping = (isTyping: boolean) => {
    if (!activeChatId || !wsRef.current) return;
    wsRef.current.send(
      JSON.stringify({
        type: 'typing',
        chatId: activeChatId,
        isTyping,
      })
    );
  };

  // Chat Actions: pin, mute, archive, delete
  const handleChatAction = async (
    chatId: string,
    action: 'pin' | 'mute' | 'archive' | 'delete',
    value: any
  ) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/chats/${chatId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, value }),
      });
      if (res.ok) {
        fetchData();
        if (action === 'delete' && activeChatId === chatId) {
          setActiveChatId(null);
        }
      }
    } catch (err) {
      console.error('Error performing chat action:', err);
    }
  };

  // User switch
  const handleSwitchUser = async (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (!target) return;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target.email, password: 'password123' }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setToken(data.token);
        localStorage.setItem('wa_token', data.token);
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('wa_token');
    setCurrentUser(null);
    setToken(null);
    cleanupCall();
  };

  const handleResetDemoData = async () => {
    if (!confirm('Reset all chats, messages, and statuses to default demo state?')) return;
    try {
      await fetch('/api/seed/reset', { method: 'POST' });
      fetchData();
    } catch {}
  };

  // Create new 1-to-1 chat
  const handleSelectUserForChat = async (user: User) => {
    if (!token) return;
    try {
      const res = await fetch('/api/chats/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'direct',
          participantIds: [user.id],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchData();
        setActiveChatId(data.chat.id);
        setMobileView('chat');
      }
    } catch (err) {
      console.error('Error creating chat:', err);
    }
  };

  // Create group chat
  const handleCreateGroup = async (name: string, participantIds: string[], description?: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/chats/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'group',
          name,
          participantIds,
          description,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchData();
        setActiveChatId(data.chat.id);
        setMobileView('chat');
      }
    } catch (err) {
      console.error('Error creating group:', err);
    }
  };

  // Manage group members
  const handleGroupMemberAction = async (action: 'add' | 'remove' | 'make_admin', memberId: string) => {
    if (!token || !activeChatId) return;
    try {
      await fetch(`/api/chats/${activeChatId}/group-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, memberId }),
      });
      fetchData();
    } catch (err) {
      console.error('Error modifying group:', err);
    }
  };

  // Status updates
  const handleCreateStatus = async (statusData: any) => {
    if (!token) return;
    try {
      await fetch('/api/statuses/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(statusData),
      });
      fetchData();
    } catch (err) {
      console.error('Error creating status:', err);
    }
  };

  const handleDeleteStatus = async (statusId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/statuses/${statusId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatusViewerData(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting status:', err);
    }
  };

  const handleViewStatus = async (statusId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/statuses/${statusId}/view`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  };

  const handleReplyStatus = (status: StatusUpdate, replyText: string) => {
    // Start or select chat with the status owner
    const existingChat = chats.find(
      c => c.type === 'direct' && c.participants.includes(status.userId)
    );
    if (existingChat) {
      setActiveChatId(existingChat.id);
      handleSendMessage({
        type: 'text',
        content: `Replied to status: "${replyText}"`,
      });
    }
  };

  // Update profile
  const handleUpdateProfile = async (updates: Partial<User>) => {
    if (!token) return;
    const res = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      setCurrentUser(data.user);
      fetchData();
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  return (
    <div
      className={`w-screen h-screen overflow-hidden flex flex-col font-sans transition-colors ${
        isDark ? 'bg-[#0c1317]' : 'bg-[#eae6df]'
      }`}
    >
      {/* Top Emerald Header Accent Bar (Classic WhatsApp Web styling) */}
      <div className="hidden lg:block h-32 bg-[#00a884] absolute top-0 left-0 right-0 z-0" />

      {/* Main WhatsApp App Container */}
      <div className="relative z-10 w-full h-full lg:h-[calc(100vh-36px)] lg:w-[calc(100vw-36px)] lg:max-w-7xl mx-auto lg:my-auto lg:rounded-2xl lg:shadow-2xl overflow-hidden flex flex-col">
        {/* App Shell Grid */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Area */}
          <div
            className={`w-full md:w-80 lg:w-[420px] flex-shrink-0 h-full ${
              mobileView === 'chat' ? 'hidden md:flex flex-col' : 'flex flex-col'
            }`}
          >
            {currentUser && (
              <Sidebar
                currentUser={currentUser}
                allUsers={allUsers}
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={id => {
                  setActiveChatId(id);
                  setMobileView('chat');
                }}
                onOpenNewChat={() => setShowNewChat(true)}
                onOpenNewGroup={() => setShowNewGroup(true)}
                onOpenSettings={() => setShowSettings(true)}
                onOpenNewStatus={() => setShowNewStatus(true)}
                onOpenStatusViewer={userStatuses => setStatusViewerData(userStatuses)}
                statuses={statuses}
                onChatAction={handleChatAction}
                onLogout={handleLogout}
                onSwitchUser={handleSwitchUser}
                onResetDemoData={handleResetDemoData}
                typingMap={typingMap}
                isDark={isDark}
              />
            )}
          </div>

          {/* Chat Feed Area */}
          <div
            className={`flex-1 h-full flex flex-col ${
              mobileView === 'sidebar' ? 'hidden md:flex flex-col' : 'flex flex-col'
            }`}
          >
            {currentUser && (
              <ChatArea
                chat={activeChat}
                currentUser={currentUser}
                allUsers={allUsers}
                messages={messages}
                onSendMessage={handleSendMessage}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onReactMessage={handleReactMessage}
                onPinMessage={handlePinMessage}
                onStartCall={handleStartCall}
                onOpenGroupInfo={() => setShowGroupInfo(true)}
                onBackToSidebar={() => setMobileView('sidebar')}
                typingUsers={activeChatId ? typingMap[activeChatId] || [] : []}
                onTyping={handleTyping}
                isDark={isDark}
              />
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal when not logged in */}
      {!currentUser && (
        <AuthModal
          onSuccess={(user, userToken) => {
            setCurrentUser(user);
            setToken(userToken);
            localStorage.setItem('wa_token', userToken);
          }}
          isDark={isDark}
        />
      )}

      {/* Settings Modal */}
      {showSettings && currentUser && (
        <SettingsModal
          currentUser={currentUser}
          onUpdateUser={handleUpdateProfile}
          onLogout={handleLogout}
          onClose={() => setShowSettings(false)}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          isDark={isDark}
        />
      )}

      {/* New Chat Modal */}
      {showNewChat && currentUser && (
        <NewChatModal
          users={allUsers}
          currentUserId={currentUser.id}
          onSelectUser={handleSelectUserForChat}
          onClose={() => setShowNewChat(false)}
          isDark={isDark}
        />
      )}

      {/* New Group Modal */}
      {showNewGroup && currentUser && (
        <NewGroupModal
          users={allUsers}
          currentUserId={currentUser.id}
          onCreateGroup={handleCreateGroup}
          onClose={() => setShowNewGroup(false)}
          isDark={isDark}
        />
      )}

      {/* Group Info Modal */}
      {showGroupInfo && activeChat && activeChat.type === 'group' && currentUser && (
        <GroupInfoModal
          chat={activeChat}
          allUsers={allUsers}
          currentUserId={currentUser.id}
          onUpdateMember={handleGroupMemberAction}
          onClose={() => setShowGroupInfo(false)}
          isDark={isDark}
        />
      )}

      {/* Status Viewer Modal */}
      {statusViewerData && currentUser && (
        <StatusViewer
          statuses={statusViewerData}
          currentUser={currentUser}
          onClose={() => setStatusViewerData(null)}
          onReply={handleReplyStatus}
          onDelete={handleDeleteStatus}
          onViewed={handleViewStatus}
          isDark={isDark}
        />
      )}

      {/* New Status Modal */}
      {showNewStatus && (
        <NewStatusModal
          onClose={() => setShowNewStatus(false)}
          onSubmit={handleCreateStatus}
          isDark={isDark}
        />
      )}

      {/* Incoming Call Ring Banner */}
      {incomingCall && (
        <IncomingCallBanner
          callerName={incomingCall.callerName}
          callerAvatar={incomingCall.callerAvatar}
          callType={incomingCall.callType}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
          isDark={isDark}
        />
      )}

      {/* Active WebRTC Call Screen */}
      {activeCall && (
        <CallModal
          activeCall={activeCall}
          onEndCall={handleEndCall}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
          isDark={isDark}
        />
      )}
    </div>
  );
}
