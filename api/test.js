module.exports = async (req, res) => {
  res.json({ 
    status: 'ok', 
    botToken: process.env.BOT_TOKEN ? 'configured' : 'missing',
    time: new Date().toISOString()
  });
};