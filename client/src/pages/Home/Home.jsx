import React, { useEffect, useState } from "react";
import './Home.scss';
import CreateRoom from "../../components/CreateRoom/CreateRoom";
import JoinRoom from "../../components/CreateRoom/JoinRoom";
import { useSelector } from "react-redux";
import socket from "../../utils/socket";
import { Link } from "react-router-dom";
import homeimg from "../../assets/home.png"

const Home = () => {

    const [roomModal, setRoomModal] = useState(false);
    const [joinModal, setJoinModal] = useState(false);
    const currentUser = useSelector((state) => state.auth.currentUser);
    const activeRooms = useSelector((state) => state.rooms.activeRooms)

    const openRoomModal = () => {
        setRoomModal(true);
    }

    const openJoinModal = () => {
        setJoinModal(true);
    }

    const handleClose = () => {
        setRoomModal(false);
        setJoinModal(false);
    }

    return (
        <div className="home-container">
            <div className="main1">
                <img className="img" src={homeimg} alt="" />
            </div>
           <div className="main2">
             <div className="welcome-section">
                <div className="message-container">Welcome, {currentUser?.firstName} !</div>
                <p className="des">Collaborate and draw together in real time on a shared online canvas.</p>
                <div className="action-container">
                    <button className="roombtn roombtn1" onClick={openRoomModal}>Personal Canvas</button>
                    <button className="roombtn" onClick={openJoinModal}>Join Room</button>
                    {roomModal && <CreateRoom onClose={handleClose} />}
                    {joinModal && <JoinRoom onClose={handleClose} />}
                </div>
            </div>
            {activeRooms.length !== 0 ?
                <div className="roomlist-container">
                    <div className="roomslist-heading">Active rooms</div>
                    <div className="rooms-list">
                        {activeRooms.map((room, index) => (
                            <Link className="active-room" to={`/room/${room.trim()}`} key={index}>{room}</Link>
                        ))}
                    </div>
                </div> : ''
            }
           </div>
        </div>
    )
}

export default Home;