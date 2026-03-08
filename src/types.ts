export interface User {
  id: number;
  username: string;
  email: string;
  age: number;
  country?: string;
  bio?: string;
  profilePic?: string;
  role: 'user' | 'admin' | 'parent';
  parentId?: number;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId?: number;
  groupId?: number;
  content: string;
  type: 'text' | 'image' | 'video' | 'document';
  fileName?: string;
  createdAt: string;
}

export interface Group {
  id: number;
  name: string;
  type: 'chat' | 'gaming';
  ownerId: number;
}
