const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Default accounts:`);
  console.log(`  Admin: admin / 123456`);
  console.log(`  User:  user1 / 123456`);
  console.log(`  Maintainer: maintainer1 / 123456`);
});
