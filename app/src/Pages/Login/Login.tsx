import axios from "axios";
import React, { useState } from "react";

import Button from "../../components/Button/Button";
import { BackArrow } from "../../components/Icons/BackArrow";
import { Input, InputPassword } from "../../components/Input/Input";
import { useLocalStorageString } from "../../hooks/useLocalStorage";
import "./Login.css";

interface LoginForm {
  email: string;
  password: string;
}

const Login = () => {
  document.title = "Блэкджек - Вход в систему";
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://sirshak.ddns.net";
  
  const [token, setToken] = useLocalStorageString("token");
  const [, setUserId] = useLocalStorageString("id");
  const [, setUsername] = useLocalStorageString("username");

  if (token) {
    window.location.href = "/dashboard";
  }

  const [formData, setFormData] = useState<LoginForm>({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      var resp = await axios.post(`${BACKEND_URL}/users/login`, formData, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
        validateStatus: () => true,
      });
      if (resp.status !== 200) {
        return alert(resp.data.message);
      }
	    setToken(resp.data.token);
      setUserId(resp.data.id);
      setUsername(resp.data.username);
      window.location.href = "/dashboard";
    } catch (error: any) {
      alert(error);
    }
  };

  return (
    <div className="container">
      <a href="/"> <BackArrow /> </a>
      <p className="text-m">Вход</p>

      <form onSubmit={handleSubmit} method="post" className="form">
      <Input 
        key="email"
        id="email"
        name="email"
        placeholder="почта"
        type="email"
        value={formData.email}
        onChange={handleInputChange}
      />

      <InputPassword
        key="password"
        id="password"
        type="password"
        name="password"
        placeholder="Пароль"
        value={formData.password}
        onChange={handleInputChange}
        show={false}
      />

        <div className="login-footer">
			<Button type="submit">Представить</Button>
        </div>
      </form>
      <div className="footer-text">
        <a href="/signup" className="signup-link">
          Зарегистрируйтесь вместо этого
        </a>
      </div>
    </div>
  );
};

export default Login;
