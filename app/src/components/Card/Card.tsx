import React from "react";
import "./Card.css";

type CardProps = {
  value: string;
  suit: string;
  hidden: boolean;
};

const Card: React.FC<CardProps> = ({ value, suit, hidden }) => {
  const getColor = () => {
    if (suit === "♠" || suit === "♣") {
      return "black";
    } else {
      return "red";
    }
  };

  const getCard = () => {
    if (hidden) {
      return <div className={`hiddenCard`} />;
    } else {
      return (
        <div className={`card`}>
          <div className={getColor()}>
            <h1 className={`value`}>{value}</h1>
            <h1 className={`suit`}>{suit}</h1>
          </div>
        </div>
      );
    }
  };

  return <>{getCard()}</>;
};

export default Card;
