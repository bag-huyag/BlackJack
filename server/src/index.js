require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const userRouter = require('./routes/users');
const gameRouter = require('./routes/games');
const playerRouter = require('./routes/players');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/users', userRouter);
app.use('/games', gameRouter);
app.use('/players', playerRouter);

app.get('/', (req, res) => {
  res.send({
    message: 'Hello World!',
  });
});

app.listen(process.env.PORT, async () => {
  try {
    // Insert 52 unique cards to the database for the game at the start of the server
    await axios.get(`http://sql.lavro.ru/call.php?db=285917&pname=insertUniqueCards`);
    console.log(`Added 52 unique cards to the database`); 
  } catch (e) {
    console.log(`NETWORK_ERROR: Failed to add 52 unique cards to the database`);
  }

  console.log(`Server is running on port http://localhost:${process.env.PORT}`);
});
