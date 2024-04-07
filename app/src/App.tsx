import './App.css';
import Button from "./components/Button";
import { useLocalStorageString } from "./hooks/useLocalStorage";

function App() {
  document.title = "Блэкджек";

  const [token] = useLocalStorageString("token");
  if (token) {
    window.location.href = "/dashboard";
  }

  return (
    <>
      <div className="container">
        <h1>Блэкджек</h1>
        <a href="/login">
          <Button>Авторизоваться</Button>
        </a>
        <span>или</span>
        <a href="/signup">
          <Button>Регистрация</Button>
        </a>
      </div>
    </>
  );
}

export default App
