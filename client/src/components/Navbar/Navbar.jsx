import React from "react";
import './Navbar.scss';


const Navbar = () => {
    return (
        <div className="navbar-container">
            <h4 className="logo">DrawMate</h4>
            <div className="nav-left">
            </div>
            <div className="nav-right">
                <div className="currentUser">
                    
                </div>
            </div>
        </div>
    )
}

export default Navbar;