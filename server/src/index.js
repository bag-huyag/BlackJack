require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const userRouter = require('./routes/userRouter');
const gameRouter = require('./routes/gameRouter');
const cardRouter = require('./routes/cardRouter');
const playerRouter = require('./routes/playerRouter');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/users', userRouter);
app.use('/games', gameRouter);
app.use('/cards', cardRouter);
app.use('/players', playerRouter);

app.get('/', (req, res) => {
  res.send({
    message: 'Hello World!',
  });
});

app.listen(process.env.PORT, async () => {
  // Insert 52 unique cards to the database for the game at the start of the server
  await axios.get(`http://sql.lavro.ru/call.php?db=285917&pname=insertUniqueCards`);
  console.log(`Added 52 unique cards to the database`); 

  console.log(`Server is running on port http://localhost:${process.env.PORT}`);
});
