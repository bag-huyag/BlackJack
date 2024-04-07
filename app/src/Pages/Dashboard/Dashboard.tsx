import React, { useEffect, useState } from 'react';
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const closeSettings = () => {
    setSettingsOpen(false);
  };

  const showSettings = () => {
    setSettingsOpen(true);
  };

  // A hacky way to close the popup when clicking outside of it
  useEffect(() => {
    const handleOutsideClick = (event: any) => {
      if (isSettingsOpen && event.target.id === 'popup-overlay') {
        setSettingsOpen(false);
      }
    };

    window.addEventListener('click', handleOutsideClick);

    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [isSettingsOpen]);


  function logout(){
    localStorage.removeItem('token');
    localStorage.removeItem('id');
    localStorage.removeItem('username');
    window.location.href = '/';
  }

  var username = localStorage.getItem('username');
  
  async function joinGame(e: React.FormEvent) {
    e.preventDefault();
    const joinCode = (document.getElementById("join-code") as HTMLInputElement).value;
    if (joinCode.length < 8) {
      alert("Game code must be of 8 characters long!");
      return;
    }
    window.location.href = `/game/${joinCode}`;
  }

  return (
    <>
    <div className="menu-container">
          <div className="user-name">Добро пожаловать {username}</div>
          
          <form onSubmit={joinGame}>
            <input type="text" name="join-code" id="join-code"  placeholder='Игровой код' required/>
            <button id='join-button' type={'submit'}>Присоединяйтесь к игре</button>
          </form>

          <a href="/games"><button type="button">Играть</button></a>
          <button type="button" onClick={showSettings}>Настройки</button>
          <button type="button" onClick={logout}>Выход</button>
    </div>

    {isSettingsOpen && (
      <div id="popup-overlay" className="popup-overlay" style={{display: 'flex', justifyContent: 'center' }}>
        <div className="popup-content">
          <span className="close-btn" onClick={closeSettings}>X</span>
          <h2>Настройки</h2>
          <div className="popup-text">
            <label className="switch">
              <input type="checkbox" />
              <span className="slider"></span>
            </label>
            <span>Звук</span>
          </div>
          <br />
          <div className="popup-text">
            <label className="switch">
              <input type="checkbox" />
              <span className="slider"></span>
            </label>
            <span>Подсказки</span>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default Dashboard;
