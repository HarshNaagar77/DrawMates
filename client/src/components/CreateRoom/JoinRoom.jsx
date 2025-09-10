import React, { useState } from 'react';
import Modal from '../../ui/Modal';
import './CreateRoom.scss';
import closeIcon from '../../assets/icons/close.png';
import { useNavigate } from 'react-router-dom';
import socket from '../../utils/socket.js';
import { useDispatch, useSelector } from 'react-redux';
import { createRoom } from '../../reducers/roomSlice.js';

const JoinRoom = ({ onClose }) => {
    const [roomName, setRoomName] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const activeRooms = useSelector(state => state.rooms.activeRooms);

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (roomName) {
            const trimmedRoom = roomName.trim();
            if (!activeRooms.includes(trimmedRoom)) {
                dispatch(createRoom(trimmedRoom));
            }
            socket.emit('createRoom', { roomName: trimmedRoom });
            setRoomName('');
            navigate(`/room/${trimmedRoom}`);
        } else {
            console.log("Error joining room!");
        }
    };

    const handleClose = () => {
        onClose && onClose();
    };

    return (
        <Modal onClose={onClose}>
            <div className='create-room-container'>
                <form>
                    <input type='text' placeholder='Enter room name to join' value={roomName} onChange={(e) => setRoomName(e.target.value)} />
                    <button onClick={handleJoinRoom}>Join Room</button>
                    <button className="close-btn" onClick={handleClose} type="button">
                        <img className="close-btn-img" src={closeIcon} alt="" />
                    </button>
                </form>
            </div>
        </Modal>
    );
};

export default JoinRoom;
