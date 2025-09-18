
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiShoppingBag, FiTool, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const Notifications = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) return;

    const newSocket = io('http://localhost:3001', {
      query: { userId: user.id, shopId: user.shopId }
    });
    setSocket(newSocket);

    newSocket.on('new_repair', (data) => {
      toast.info(
        <div>
          <div className="font-bold flex items-center">
            <FiTool className="mr-2" /> New Repair Request
          </div>
          <div>{data.customerName} - {data.device}</div>
        </div>,
        { autoClose: 5000 }
      );
    });

    newSocket.on('new_order', (data) => {
      toast.success(
        <div>
          <div className="font-bold flex items-center">
            <FiShoppingBag className="mr-2" /> New Purchase
          </div>
          <div>Order #{data.orderId} - ${data.amount}</div>
        </div>,
        { autoClose: 5000 }
      );
    });

    newSocket.on('new_message', (data) => {
      toast(
        <div>
          <div className="font-bold flex items-center">
            <FiMessageSquare className="mr-2" /> New Message
          </div>
          <div>From: {data.sender}</div>
        </div>,
        { autoClose: 5000 }
      );
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return null;
};

export default Notifications;