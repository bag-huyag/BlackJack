import React, { useState, useEffect } from "react";
import axios from "axios";

import "./Signup.css";
import { useLocalStorageString } from "hooks/useLocalStorage";
import Button from "components/Button/Button";
import { BackArrow } from "components/Icons/BackArrow";
import { Input, InputPassword } from "components/Input/Input";

import { BACKEND_URL } from "../../config";

interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

const Signup = () => {
  document.title = "Блэкджек - Регистрация";
  const [token, setToken] = useLocalStorageString("token");
  if (token) {
    window.location.href = "/dashboard";
  }

  const [formData, setFormData] = useState<SignupForm>({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm) {
      alert("Пароли не совпадают!");
      return;
    }
    try {
      var resp = await axios.post(`${BACKEND_URL}/users/signup`, formData, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
        validateStatus: () => true,
      });
      if (resp.status !== 201) {
        return alert(resp.data.message);
      }
      setToken(resp.data.token);
      window.location.href = "/dashboard";
    } catch (error: any) {
      alert(error);
    }
  };

  return (
    <div className="container">
      <a href="/">
        {" "}
        <BackArrow />
      </a>
      <h2>Регистрация</h2>
      <form method="post" onSubmit={handleSubmit}>
        <Input
          key="name"
          id="name"
          type="text"
          name="name"
          placeholder="Имя"
          value={formData.name}
          onChange={handleInputChange}
        />
        <Input
		  key="email"
		  id="email"
          type="text"
		  name="email"
		  placeholder="Почта"
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

		<InputPassword
		  key="confirm"
		  id="confirm"
      	  type="password"
		  name="confirm"
		  placeholder="confirm"	
		  value={formData.confirm}
		  onChange={handleInputChange}
		  show={false}
		/>
		
        <Button type="submit">Продолжить</Button>
      </form>
      <p className="footer-text">
        Нажимая "Продолжить", вы соглашаетесь
        <span className="colortext">Условиями использования</span>
        <span className="colortext">Политикой конфиденциальности</span>
      </p>
    </div>
  );
};

export default Signup;
