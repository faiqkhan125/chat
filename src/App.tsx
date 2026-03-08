import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { 
  MessageSquare, 
  Phone, 
  Gamepad2, 
  Bot, 
  FileText, 
  Settings, 
  Send, 
  Paperclip, 
  Video, 
  Mic, 
  User as UserIcon,
  LogOut,
  Shield,
  Plus,
  Search,
  MoreVertical,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Monitor,
  Smartphone,
  Camera,
  X,
  Edit2,
  ArrowLeft,
  Info,
  Mail,
  Link as LinkIcon,
  ChevronRight,
  Download,
  PhoneOff,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { format } from 'date-fns';
import { cn } from './lib/utils';
import { User, Message, Group } from './types';

// Components
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-zinc-500 mb-6">We're sorry for the inconvenience. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-semibold transition-all"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const MessageItem = React.memo(({ msg, isMe, senderPic }: { msg: Message, isMe: boolean, senderPic?: string }) => {
  const handleDownload = (e: React.MouseEvent, url: string, fileName?: string) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || url.split('/').pop() || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    switch (msg.type) {
      case 'image':
        return (
          <div className="space-y-2 group relative">
            <img 
              src={msg.content} 
              alt={msg.fileName || 'Image'} 
              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(msg.content, '_blank')}
              referrerPolicy="no-referrer"
            />
            <div className="flex items-center justify-between mt-1">
              {msg.fileName && <p className="text-[10px] opacity-60 truncate max-w-[150px]">{msg.fileName}</p>}
              <button 
                onClick={(e) => handleDownload(e, msg.content, msg.fileName)}
                className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full transition-all text-white/80 hover:text-white"
                title="Download Image"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      case 'video':
        return (
          <div className="space-y-2 group relative">
            <video 
              src={msg.content} 
              controls 
              className="max-w-full rounded-lg"
            />
            <div className="flex items-center justify-between mt-1">
              {msg.fileName && <p className="text-[10px] opacity-60 truncate max-w-[150px]">{msg.fileName}</p>}
              <button 
                onClick={(e) => handleDownload(e, msg.content, msg.fileName)}
                className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full transition-all text-white/80 hover:text-white"
                title="Download Video"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      case 'document':
        return (
          <div className="flex items-center justify-between space-x-3 w-full">
            <a 
              href={msg.content} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-3 hover:bg-white/5 p-1 rounded-lg transition-colors flex-1 min-w-0"
            >
              <div className="p-2 bg-white/10 rounded-lg shrink-0">
                <FileText className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="font-medium text-xs md:text-sm truncate">{msg.fileName || 'Document'}</p>
                <p className="text-[9px] md:text-[10px] opacity-60">View File</p>
              </div>
            </a>
            <button 
              onClick={(e) => handleDownload(e, msg.content, msg.fileName)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white/80 hover:text-white shrink-0"
              title="Download Document"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        );
      default:
        return <p className="whitespace-pre-wrap break-words">{msg.content}</p>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isMe ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex max-w-[90%] md:max-w-[75%] mb-4 md:mb-6 space-x-2 md:space-x-3",
        isMe ? "ml-auto flex-row-reverse space-x-reverse" : "flex-row"
      )}
    >
      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 mt-1">
        {senderPic ? (
          <img src={senderPic} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <UserIcon className="w-4 h-4 text-zinc-500" />
        )}
      </div>
      <div className={cn(
        "flex flex-col",
        isMe ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "px-3 py-2 md:px-4 md:py-3 rounded-2xl text-xs md:text-sm",
          isMe ? "bg-emerald-500 text-white rounded-tr-none" : "bg-zinc-900 text-zinc-200 rounded-tl-none"
        )}>
          {renderContent()}
        </div>
        <span className="text-[9px] md:text-[10px] text-zinc-600 mt-1 flex items-center space-x-1">
          <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
          {isMe && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
        </span>
      </div>
    </motion.div>
  );
});

const CallModal = ({ 
  user, 
  otherUser, 
  type, 
  status, 
  onEnd, 
  onAnswer, 
  onReject,
  onSwitchToVideo,
  localStream,
  remoteStream
}: { 
  user: User, 
  otherUser: User, 
  type: 'audio' | 'video', 
  status: 'calling' | 'ringing' | 'connected',
  onEnd: () => void,
  onAnswer: () => void,
  onReject: () => void,
  onSwitchToVideo?: () => void,
  localStream: MediaStream | null,
  remoteStream: MediaStream | null
}) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let interval: any;
    if (status === 'connected') {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-8"
    >
      <div className="w-full max-w-4xl aspect-video md:aspect-auto md:h-[80vh] bg-zinc-900 rounded-[2rem] overflow-hidden relative flex flex-col shadow-2xl border border-white/10">
        
        {/* Video Area */}
        {type === 'video' ? (
          <div className="flex-1 relative bg-black">
            {remoteStream ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                <div className="w-32 h-32 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden">
                  {otherUser.profilePic ? (
                    <img src={otherUser.profilePic} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-zinc-600" />
                  )}
                </div>
                <p className="text-xl font-bold text-white">{otherUser.username}</p>
                <p className="text-emerald-500 animate-pulse">{status === 'calling' ? 'Calling...' : status === 'ringing' ? 'Ringing...' : 'Connecting...'}</p>
              </div>
            )}
            
            {/* Local Preview */}
            <div className="absolute top-4 right-4 w-32 md:w-48 aspect-video bg-zinc-800 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 bg-gradient-to-b from-zinc-900 to-black">
            <div className="relative">
              <div className="w-40 h-40 md:w-56 md:h-56 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden ring-4 ring-emerald-500/20">
                {otherUser.profilePic ? (
                  <img src={otherUser.profilePic} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-20 h-20 text-zinc-600" />
                )}
              </div>
              {status === 'connected' && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  {formatDuration(duration)}
                </div>
              )}
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">{otherUser.username}</h2>
              <p className="text-zinc-400">{status === 'calling' ? 'Calling...' : status === 'ringing' ? 'Incoming Call' : 'On Call'}</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-4 md:space-x-8">
          {status === 'ringing' && !localStream ? (
            <>
              <button 
                onClick={onReject}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
              <button 
                onClick={onAnswer}
                className="w-16 h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 animate-bounce"
              >
                <Phone className="w-8 h-8" />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={cn(
                  "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all",
                  isSpeakerOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-zinc-800 text-zinc-500"
                )}
                title="Speaker"
              >
                <Volume2 className="w-6 h-6" />
              </button>

              <button 
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (localStream) {
                    localStream.getAudioTracks().forEach(track => track.enabled = isMuted);
                  }
                }}
                className={cn(
                  "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all",
                  isMuted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                )}
                title="Mute"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              
              {type === 'video' ? (
                <button 
                  onClick={() => {
                    setIsVideoOff(!isVideoOff);
                    if (localStream) {
                      localStream.getVideoTracks().forEach(track => track.enabled = isVideoOff);
                    }
                  }}
                  className={cn(
                    "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all",
                    isVideoOff ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                  title="Video"
                >
                  {isVideoOff ? <Camera className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </button>
              ) : (
                status === 'connected' && onSwitchToVideo && (
                  <button 
                    onClick={onSwitchToVideo}
                    className="w-12 h-12 md:w-14 md:h-14 bg-white/10 text-white hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
                    title="Switch to Video"
                  >
                    <Video className="w-6 h-6" />
                  </button>
                )
              )}

              <button 
                onClick={onEnd}
                className="w-16 h-16 md:w-20 md:h-20 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110"
              >
                <PhoneOff className="w-8 h-8 md:w-10 md:h-10" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ProfileModal = ({ user, onClose, onUpdate }: { user: User, onClose: () => void, onUpdate: (user: User) => void }) => {
  const [bio, setBio] = useState(user.bio || '');
  const [profilePic, setProfilePic] = useState(user.profilePic || '');
  const [country, setCountry] = useState(user.country || '');
  const [email, setEmail] = useState(user.email || '');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingCountry, setIsEditingCountry] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfilePic(base64);
        handleUpdateProfile({ profilePic: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteDP = () => {
    setProfilePic('');
    handleUpdateProfile({ profilePic: '' });
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    try {
      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: updates.bio ?? bio,
          profilePic: updates.profilePic ?? profilePic,
          country: updates.country ?? country,
          email: updates.email ?? email
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }
      const updatedUser = await res.json();
      onUpdate(updatedUser);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update profile");
    }
  };

  return (
    <motion.div 
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 md:inset-y-0 md:left-0 md:right-auto md:w-80 lg:w-96 bg-[#0b141a] z-[100] flex flex-col border-r border-white/5 shadow-2xl"
    >
      {/* Header */}
      <div className="h-16 flex items-center px-4 space-x-8 bg-[#202c33] text-white shadow-md">
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-medium">Profile</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Picture Section */}
        <div className="py-8 flex flex-col items-center bg-[#0b141a]">
          <div className="relative w-48 h-48 rounded-full overflow-hidden bg-[#202c33] flex items-center justify-center mb-4 ring-1 ring-white/10">
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UserIcon className="w-24 h-24 text-[#8696a0]" />
            )}
          </div>
          <div className="flex flex-col items-center space-y-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-[#00a884] font-medium hover:text-[#06cf9c] transition-colors"
            >
              Edit Photo
            </button>
            {profilePic && (
              <button 
                onClick={handleDeleteDP}
                className="text-red-500 font-medium hover:text-red-400 transition-colors text-sm"
              >
                Remove Photo
              </button>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
            accept="image/*"
          />
        </div>

        {/* Info List */}
        <div className="space-y-1">
          {/* Name */}
          <div className="flex items-start px-6 py-4 hover:bg-[#202c33]/50 transition-colors cursor-default">
            <UserIcon className="w-6 h-6 text-[#8696a0] mt-1 mr-8" />
            <div className="flex-1 border-b border-white/5 pb-4">
              <p className="text-[#8696a0] text-sm mb-1">Name</p>
              <p className="text-white text-lg">{user.username}</p>
              <p className="text-[#8696a0] text-xs mt-2">This is not your username or pin. This name will be visible to your Nexus contacts.</p>
            </div>
          </div>

          {/* Country */}
          <div className="flex items-start px-6 py-4 hover:bg-[#202c33]/50 transition-colors group">
            <Info className="w-6 h-6 text-[#8696a0] mt-1 mr-8" />
            <div className="flex-1 border-b border-white/5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-[#8696a0] text-sm mb-1">Country</p>
                  {isEditingCountry ? (
                    <input 
                      autoFocus
                      className="bg-transparent border-b border-[#00a884] text-white text-lg focus:outline-none w-full"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      onBlur={() => {
                        setIsEditingCountry(false);
                        handleUpdateProfile({ country });
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          setIsEditingCountry(false);
                          handleUpdateProfile({ country });
                        }
                      }}
                    />
                  ) : (
                    <p className="text-white text-lg">{country || 'Not set'}</p>
                  )}
                </div>
                <button 
                  onClick={() => setIsEditingCountry(true)}
                  className="p-2 text-[#00a884] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start px-6 py-4 hover:bg-[#202c33]/50 transition-colors group">
            <Mail className="w-6 h-6 text-[#8696a0] mt-1 mr-8" />
            <div className="flex-1 border-b border-white/5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-[#8696a0] text-sm mb-1">Email</p>
                  {isEditingEmail ? (
                    <input 
                      autoFocus
                      type="email"
                      className="bg-transparent border-b border-[#00a884] text-white text-lg focus:outline-none w-full"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => {
                        setIsEditingEmail(false);
                        handleUpdateProfile({ email });
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          setIsEditingEmail(false);
                          handleUpdateProfile({ email });
                        }
                      }}
                    />
                  ) : (
                    <p className="text-white text-lg">{email}</p>
                  )}
                </div>
                <button 
                  onClick={() => setIsEditingEmail(true)}
                  className="p-2 text-[#00a884] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bio (Links) */}
          <div className="flex items-start px-6 py-4 hover:bg-[#202c33]/50 transition-colors group">
            <LinkIcon className="w-6 h-6 text-[#8696a0] mt-1 mr-8" />
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#8696a0] text-sm mb-1">Bio</p>
                  {isEditingBio ? (
                    <div className="flex items-center space-x-2 mt-2">
                      <input 
                        autoFocus
                        className="bg-transparent border-b border-[#00a884] text-white text-lg focus:outline-none w-full"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        onBlur={() => {
                          setIsEditingBio(false);
                          handleUpdateProfile({ bio });
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            setIsEditingBio(false);
                            handleUpdateProfile({ bio });
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <p className="text-white text-lg">{bio || 'Set Bio'}</p>
                  )}
                </div>
                <button 
                  onClick={() => setIsEditingBio(true)}
                  className="p-2 text-[#00a884] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AuthScreen = ({ onLogin }: { onLogin: (user: User, token: string) => void }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', age: '', country: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => console.log("Server health:", data))
      .catch(err => {
        console.error("Server health check failed:", err);
        setError("Server is not responding. Please wait or refresh.");
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/signin';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const text = await res.text();
      if (!text) {
        throw new Error("Server returned an empty response. Please try again.");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("JSON Parse Error:", text);
        throw new Error("Server returned an invalid response. Please try again.");
      }

      if (data.error) throw new Error(data.error);
      if (isSignUp) {
        setIsSignUp(false);
        alert('Signup successful! Please sign in.');
      } else {
        onLogin(data.user, data.token);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl my-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
            <MessageSquare className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Nexus AI</h1>
          <p className="text-zinc-400 mt-2">The future of communication</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <input
                type="text"
                placeholder="Username"
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Age"
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Country (e.g. Pakistan, USA)"
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </>
          )}
          <input
            type="email"
            placeholder="Gmail"
            className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-zinc-500 mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-emerald-500 font-medium hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <NexusApp />
    </ErrorBoundary>
  );
}

function NexusApp() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('chats');
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const selectedContactRef = useRef<User | null>(null);

  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [automationScript, setAutomationScript] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [incomingCall, setIncomingCall] = useState<{ signal: any, from: number, fromUser: User } | null>(null);
  const [activeCallUser, setActiveCallUser] = useState<User | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [onlineStatuses, setOnlineStatuses] = useState<Record<number, boolean>>({});
  const [showContactInfo, setShowContactInfo] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && token) {
      socketRef.current = io(window.location.origin);
      socketRef.current.emit('join', user.id);

      socketRef.current.on('receive_message', (msg: Message) => {
        // Update messages if it's for the selected contact
        if (
          (selectedContactRef.current && msg.senderId === selectedContactRef.current.id) ||
          (selectedContactRef.current && msg.receiverId === selectedContactRef.current.id && msg.senderId === user.id)
        ) {
          setMessages(prev => [...prev, msg]);
        }

        // Update contacts list if it's a new interaction
        setContacts(prev => {
          const otherId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
          if (prev.find(c => c.id === otherId)) return prev;
          fetchContacts();
          return prev;
        });
      });

      socketRef.current.on('user_status', (data: { userId: number, status: 'online' | 'offline' }) => {
        setOnlineStatuses(prev => ({
          ...prev,
          [data.userId]: data.status === 'online'
        }));
      });

      socketRef.current.on('initial_online_users', (userIds: number[]) => {
        const statuses: Record<number, boolean> = {};
        userIds.forEach(id => {
          statuses[id] = true;
        });
        setOnlineStatuses(statuses);
      });

      socketRef.current.on('user_profile_updated', (data: { userId: number, profilePic: string, username: string, bio: string, country: string }) => {
        setContacts(prev => prev.map(c => 
          c.id === data.userId 
            ? { ...c, profilePic: data.profilePic, username: data.username, bio: data.bio, country: data.country }
            : c
        ));
        if (selectedContact?.id === data.userId) {
          setSelectedContact(prev => prev ? ({ ...prev, profilePic: data.profilePic, username: data.username, bio: data.bio, country: data.country }) : null);
        }
      });

      // --- WebRTC Listeners ---
      socketRef.current.on('incoming_call', (data) => {
        setIncomingCall(data);
        setActiveCallUser(data.fromUser);
        setCallType(data.type);
        setCallStatus('ringing');
      });

      socketRef.current.on('call_accepted', async (data) => {
        if (peerRef.current) {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.signal));
          setCallStatus('connected');
          setCallStartTime(Date.now());
        }
      });

      socketRef.current.on('call_status_update', (data) => {
        if (callStatus === 'calling' || callStatus === 'ringing') {
          setCallStatus(data.status);
        }
      });

      socketRef.current.on('ice_candidate', async (data) => {
        if (peerRef.current && data.candidate) {
          try {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.error("Error adding ice candidate", e);
          }
        }
      });

      socketRef.current.on('call_rejected', () => {
        cleanupCall();
        alert("Call rejected");
      });

      socketRef.current.on('call_ended', () => {
        cleanupCall();
      });

      socketRef.current.on('switch_to_video', async () => {
        setCallType('video');
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const videoTrack = videoStream.getVideoTracks()[0];
          if (localStream) {
            localStream.addTrack(videoTrack);
            const sender = peerRef.current?.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          }
        } catch (err) {
          console.error("Error switching to video", err);
        }
      });

      fetchContacts();
    }
    return () => {
      socketRef.current?.disconnect();
    };
  }, [user, token]);

  useEffect(() => {
    if (selectedContact && user) {
      fetchMessages();
      setShowContactInfo(false);
    } else {
      setMessages([]);
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeTab === 'calls' && user) {
      fetchCallHistory();
    }
  }, [activeTab, user]);

  const fetchCallHistory = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/calls/${user.id}`);
      const data = await res.json();
      setCallHistory(data);
    } catch (err) {
      console.error("fetchCallHistory error:", err);
    }
  };

  const cleanupCall = () => {
    peerRef.current?.close();
    peerRef.current = null;
    localStream?.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
    setIncomingCall(null);
    setActiveCallUser(null);
    setCallStartTime(null);
  };

  const switchToVideo = async () => {
    if (callType === 'video' || !localStream || !peerRef.current || !activeCallUser) return;
    
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = videoStream.getVideoTracks()[0];
      
      const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(videoTrack);
      } else {
        peerRef.current.addTrack(videoTrack, localStream);
      }
      
      localStream.addTrack(videoTrack);
      setCallType('video');
      
      socketRef.current?.emit('switch_to_video', { to: activeCallUser.id });
    } catch (err) {
      console.error("Switch to video error:", err);
    }
  };

  const createPeerConnection = (targetUserId: number) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice_candidate', { to: targetUserId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    return pc;
  };

  const startCall = async (type: 'audio' | 'video') => {
    if (!selectedContact || !user) return;
    
    setCallType(type);
    setCallStatus('calling');
    setActiveCallUser(selectedContact);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });
      setLocalStream(stream);

      const pc = createPeerConnection(selectedContact.id);
      peerRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.emit('call_user', {
        to: selectedContact.id,
        from: user.id,
        signal: offer,
        type,
        fromUser: user
      });
    } catch (err) {
      console.error("Call error:", err);
      cleanupCall();
      alert("Could not access camera/microphone");
    }
  };

  const answerCall = async () => {
    if (!incomingCall || !user) return;

    setCallStatus('connected');
    setCallStartTime(Date.now());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      });
      setLocalStream(stream);

      const pc = createPeerConnection(incomingCall.from);
      peerRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit('answer_call', {
        to: incomingCall.from,
        signal: answer
      });
    } catch (err) {
      console.error("Answer error:", err);
      cleanupCall();
    }
  };

  const rejectCall = () => {
    if (incomingCall && user) {
      socketRef.current?.emit('reject_call', { 
        to: incomingCall.from,
        callerId: incomingCall.from,
        receiverId: user.id,
        type: callType
      });
    }
    cleanupCall();
  };

  const endCall = () => {
    const targetId = activeCallUser?.id || incomingCall?.from;
    const duration = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : 0;
    const status = callStatus === 'connected' ? 'completed' : 'missed';

    if (targetId && user) {
      socketRef.current?.emit('end_call', { 
        to: targetId,
        callerId: user.id,
        receiverId: targetId,
        type: callType,
        status,
        duration
      });
    }
    cleanupCall();
  };

  const fetchContacts = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users?currentUserId=${user.id}`);
      const text = await res.text();
      if (!text) throw new Error("Empty response from /api/users");
      const data = JSON.parse(text);
      setContacts(data);
    } catch (err) {
      console.error("fetchContacts error:", err);
    }
  };

  const fetchMessages = async () => {
    if (!selectedContact || !user) return;
    try {
      const res = await fetch(`/api/messages/${user.id}/${selectedContact.id}`);
      const text = await res.text();
      if (!text) throw new Error("Empty response from /api/messages");
      const data = JSON.parse(text);
      setMessages(data);
    } catch (err) {
      console.error("fetchMessages error:", err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`/api/users/search?email=${encodeURIComponent(searchQuery)}`);
      const text = await res.text();
      if (!res.ok) {
        alert("User not found with this Gmail.");
        return;
      }
      const foundUser = JSON.parse(text);
      if (foundUser.id === user?.id) {
        alert("You cannot chat with yourself.");
        return;
      }
      // Add to contacts if not already there
      setContacts(prev => {
        if (prev.find(c => c.id === foundUser.id)) return prev;
        return [foundUser, ...prev];
      });
      setSelectedContact(foundUser);
      setSearchQuery('');
    } catch (err) {
      console.error("Search error:", err);
      alert("Error searching for user.");
    }
  };

  const sendMessage = () => {
    if (!input.trim() || !selectedContact || !user) return;
    const msgData = {
      senderId: user.id,
      receiverId: selectedContact.id,
      content: input,
      type: 'text'
    };
    socketRef.current?.emit('send_message', msgData);
    setInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedContact || !user) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      
      const msgData = {
        senderId: user.id,
        receiverId: selectedContact.id,
        content: data.url,
        type: data.type,
        fileName: data.fileName
      };
      socketRef.current?.emit('send_message', msgData);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleAutomation = async () => {
    if (!automationScript.trim() || !user) return;
    try {
      const res = await fetch('/api/automation/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: automationScript }),
      });
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const text = await res.text();
      if (!text) {
        throw new Error("Empty response from server");
      }

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid JSON response from server");
      }
      
      if (parsed) {
        const target = contacts.find(c => c.username.toLowerCase().includes(parsed.targetName.toLowerCase()));
        if (target) {
          await fetch('/api/automation/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              command: parsed.type,
              targetUserId: target.id,
              message: parsed.message,
              scheduledTime: parsed.scheduledTime
            }),
          });
          alert(`Task scheduled: Send "${parsed.message}" to ${target.username} at ${format(new Date(parsed.scheduledTime), 'PPp')}`);
        } else {
          alert(`Could not find user: ${parsed.targetName}`);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to parse automation script.");
    }
    setAutomationScript('');
  };

  if (!user) {
    return <AuthScreen onLogin={(u, t) => { setUser(u); setToken(t); }} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      <AnimatePresence>
        {showProfile && user && (
          <ProfileModal 
            user={user} 
            onClose={() => setShowProfile(false)} 
            onUpdate={(updatedUser) => setUser(updatedUser)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {callStatus !== 'idle' && activeCallUser && user && (
          <CallModal 
            user={user}
            otherUser={activeCallUser}
            type={callType}
            status={callStatus}
            localStream={localStream}
            remoteStream={remoteStream}
            onEnd={endCall}
            onAnswer={answerCall}
            onReject={rejectCall}
            onSwitchToVideo={switchToVideo}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop: Left, Mobile: Bottom */}
      <div className={cn(
        "bg-[#141414] border-white/5 flex transition-all z-40",
        "md:w-24 md:flex-col md:border-r md:py-8 md:items-center md:space-y-8",
        "w-full h-16 flex-row border-t py-0 items-center justify-around fixed bottom-0 md:relative md:bottom-auto",
        selectedContact ? "hidden md:flex" : "flex"
      )}>
        <button 
          onClick={() => setShowProfile(true)}
          className="w-10 h-10 md:w-12 md:h-12 bg-zinc-800 rounded-2xl flex items-center justify-center shadow-lg hover:ring-2 hover:ring-emerald-500 transition-all overflow-hidden"
        >
          {user.profilePic ? (
            <img src={user.profilePic} alt="Me" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <UserIcon className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
          )}
        </button>
        
        <nav className="flex flex-row md:flex-col items-center justify-center space-x-4 md:space-x-0 md:space-y-6 md:flex-1">
          {[
            { id: 'chats', icon: MessageSquare, label: 'Chats' },
            { id: 'calls', icon: Phone, label: 'Calls' },
            { id: 'gaming', icon: Gamepad2, label: 'Gaming' },
            { id: 'ai', icon: Bot, label: 'AI' },
            { id: 'files', icon: FileText, label: 'Files' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "p-2 md:p-3 rounded-2xl transition-all group relative",
                activeTab === item.id ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5 md:w-6 md:h-6" />
              <span className="hidden md:block absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <button 
          onClick={() => setUser(null)}
          className="p-2 md:p-3 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
        >
          <LogOut className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden pb-16 md:pb-0">
        {/* List Section */}
        <div className={cn(
          "bg-[#0f0f0f] border-r border-white/5 flex flex-col transition-all",
          "w-full md:w-80 lg:w-96",
          selectedContact ? "hidden md:flex" : "flex"
        )}>
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <button 
                onClick={() => setShowProfile(true)}
                className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center overflow-hidden border border-white/5 shadow-lg hover:ring-2 hover:ring-emerald-500 transition-all"
              >
                {user.profilePic ? (
                  <img src={user.profilePic} alt="Me" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-5 h-5 text-emerald-500" />
                )}
              </button>
              <h2 className="text-2xl font-bold capitalize flex-1">{activeTab}</h2>
              <button className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <Plus className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search by Gmail..." 
                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'calls' && (
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
                {callHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-50 space-y-4">
                    <Phone className="w-12 h-12" />
                    <p className="text-sm">No call history yet</p>
                  </div>
                ) : (
                  callHistory.map((call) => (
                    <div key={call.id} className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:bg-zinc-900 transition-all">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden">
                          {call.otherProfilePic ? (
                            <img src={call.otherProfilePic} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-6 h-6 text-zinc-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-200">{call.otherUsername}</h4>
                          <div className="flex items-center space-x-2 text-[10px] text-zinc-500">
                            {call.status === 'missed' ? (
                              <span className="text-red-500 flex items-center"><PhoneOff className="w-3 h-3 mr-1" /> Missed</span>
                            ) : call.status === 'rejected' ? (
                              <span className="text-zinc-500 flex items-center"><X className="w-3 h-3 mr-1" /> Rejected</span>
                            ) : (
                              <span className="text-emerald-500 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> {call.duration}s</span>
                            )}
                            <span>•</span>
                            <span>{format(new Date(call.createdAt), 'MMM d, HH:mm')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            const target = contacts.find(c => c.id === (call.callerId === user.id ? call.receiverId : call.callerId));
                            if (target) {
                              setSelectedContact(target);
                              startCall(call.type);
                            }
                          }}
                          className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          {call.type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {activeTab === 'chats' && (
              <Virtuoso
                style={{ height: '100%' }}
                data={contacts}
                itemContent={(index, contact) => (
                  <div className="px-4 py-1">
                    <button
                      onClick={() => setSelectedContact(contact)}
                      className={cn(
                        "w-full p-4 rounded-2xl flex items-center space-x-4 transition-all",
                        selectedContact?.id === contact.id ? "bg-emerald-500/10 border border-emerald-500/20" : "hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden">
                          {contact.profilePic ? (
                            <img src={contact.profilePic} alt={contact.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <UserIcon className="w-6 h-6 text-zinc-500" />
                          )}
                        </div>
                        {onlineStatuses[contact.id] && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0f0f0f] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-zinc-200">{contact.username}</span>
                          <span className="text-[10px] text-zinc-500">12:45 PM</span>
                        </div>
                        <p className="text-sm text-zinc-500 truncate">Hey, how are you doing today?</p>
                      </div>
                    </button>
                  </div>
                )}
              />
            )}

            {activeTab === 'ai' && (
              <div className="p-4 space-y-4 overflow-y-auto h-full">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Bot className="w-5 h-5 text-emerald-500" />
                    <span className="font-semibold text-emerald-500">AI Automation</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-4">
                    Give me a script like "Send message 'Hello' to John at 5 PM" and I'll handle it.
                  </p>
                  <textarea
                    value={automationScript}
                    onChange={(e) => setAutomationScript(e.target.value)}
                    placeholder="Enter automation script..."
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl p-3 text-sm h-24 focus:outline-none focus:border-emerald-500/50 mb-3"
                  />
                  <button 
                    onClick={handleAutomation}
                    className="w-full bg-emerald-500 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors"
                  >
                    Schedule Action
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'gaming' && (
              <div className="space-y-3">
                {['Valorant Pro', 'Minecraft Chill', 'GTA V Heists'].map((room) => (
                  <div key={room} className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-900 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{room}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full">Live</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-zinc-500">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => <div key={i} className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-900" />)}
                      </div>
                      <span>+12 members</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="p-6 space-y-6">
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center">
                  <h3 className="font-bold mb-4">Web Login QR</h3>
                  <div className="bg-white p-4 rounded-xl mb-4">
                    <div className="w-32 h-32 bg-zinc-100 flex items-center justify-center text-black font-bold text-center text-xs">
                      [QR CODE TOKEN]
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 text-center">
                    Scan this QR code with your mobile app to login on PC/Laptop instantly.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <button className="w-full p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center justify-between hover:bg-zinc-900 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm font-medium">Privacy & Security</span>
                    </div>
                    <MoreVertical className="w-4 h-4 text-zinc-500" />
                  </button>
                  <button className="w-full p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center justify-between hover:bg-zinc-900 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Monitor className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium">Linked Devices</span>
                    </div>
                    <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded-full text-zinc-400">2 Active</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div className={cn(
          "flex-1 flex flex-col bg-[#0a0a0a] transition-all",
          selectedContact ? "flex" : "hidden md:flex"
        )}>
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="h-16 md:h-20 border-b border-white/5 px-4 md:px-8 flex items-center justify-between">
                <div 
                  className="flex items-center space-x-3 md:space-x-4 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowContactInfo(!showContactInfo)}
                >
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedContact(null);
                    }}
                    className="md:hidden p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6 text-zinc-400" />
                  </button>
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden">
                    {selectedContact.profilePic ? (
                      <img src={selectedContact.profilePic} alt={selectedContact.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-zinc-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-200 text-sm md:text-base">{selectedContact.username}</h3>
                    <div className="flex items-center space-x-1">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        onlineStatuses[selectedContact.id] ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-500"
                      )} />
                      <span className={cn(
                        "text-[10px] md:text-xs font-medium",
                        onlineStatuses[selectedContact.id] ? "text-emerald-500" : "text-zinc-500"
                      )}>
                        {onlineStatuses[selectedContact.id] ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-4">
                  <button 
                    onClick={() => startCall('audio')}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  >
                    <Phone className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button 
                    onClick={() => startCall('video')}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  >
                    <Video className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><MoreVertical className="w-4 h-4 md:w-5 md:h-5" /></button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-hidden bg-[#0a0a0a]">
                <Virtuoso
                  style={{ height: '100%' }}
                  data={messages}
                  initialTopMostItemIndex={messages.length - 1}
                  followOutput="smooth"
                  itemContent={(index, msg) => (
                    <div className="px-4 md:px-8 pt-4">
                      <MessageItem 
                        msg={msg} 
                        isMe={msg.senderId === user.id} 
                        senderPic={msg.senderId === user.id ? user.profilePic : selectedContact.profilePic}
                      />
                    </div>
                  )}
                  components={{
                    Footer: () => <div className="h-4 md:h-8" />
                  }}
                />
              </div>

              {/* Chat Input */}
              <div className="p-4 md:p-8">
                <div className="bg-[#141414] border border-white/5 rounded-3xl p-1 md:p-2 flex items-center space-x-1 md:space-x-2">
                  <label className={cn(
                    "p-2 md:p-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all cursor-pointer",
                    isUploading && "animate-pulse pointer-events-none opacity-50"
                  )}>
                    <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                  </label>
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..." 
                    className="flex-1 bg-transparent border-none focus:outline-none text-xs md:text-sm px-1 md:px-2"
                  />
                  <button className="hidden sm:block p-2 md:p-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"><Mic className="w-4 h-4 md:w-5 md:h-5" /></button>
                  <button 
                    onClick={sendMessage}
                    className="p-2 md:p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Send className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-zinc-500 space-y-4">
              <div className="w-20 h-20 bg-zinc-900/50 rounded-3xl flex items-center justify-center">
                <MessageSquare className="w-10 h-10 opacity-20" />
              </div>
              <p className="text-sm font-medium">Select a chat to start messaging</p>
              <div className="flex items-center space-x-2 text-xs opacity-50">
                <Shield className="w-3 h-3" />
                <span>End-to-end encrypted</span>
              </div>
            </div>
          )}
        </div>

        {/* Info Sidebar (Right) */}
        <AnimatePresence>
          {selectedContact && showContactInfo && (
            <motion.div 
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              className="w-80 bg-[#0f0f0f] border-l border-white/5 p-8 flex flex-col fixed md:relative right-0 top-0 h-full z-50 md:z-auto shadow-2xl md:shadow-none"
            >
              <div className="flex justify-end mb-4 md:hidden">
                <button onClick={() => setShowContactInfo(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-24 h-24 bg-zinc-800 rounded-3xl flex items-center justify-center mb-4 overflow-hidden">
                  {selectedContact.profilePic ? (
                    <img src={selectedContact.profilePic} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-zinc-500" />
                  )}
                </div>
                <h3 className="text-xl font-bold">{selectedContact.username}</h3>
                <p className="text-sm text-zinc-500 mt-1">{selectedContact.email}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Security</h4>
                  <div className="bg-zinc-900/50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Encryption</span>
                      <span className="text-emerald-500 font-medium">Active</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Safety Check</span>
                      <span className="text-emerald-500 font-medium">Passed</span>
                    </div>
                  </div>
                </div>

                {user.age < 15 && (
                  <div>
                    <h4 className="text-xs font-bold text-red-500/80 uppercase tracking-widest mb-4">Parental Control</h4>
                    <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4">
                      <div className="flex items-center space-x-2 text-red-500 mb-2">
                        <ShieldAlert className="w-4 h-4" />
                        <span className="text-xs font-bold">Monitored Account</span>
                      </div>
                      <p className="text-[10px] text-zinc-500">Your parent can see your activity for safety.</p>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Shared Media</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="aspect-square bg-zinc-900 rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer" />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
