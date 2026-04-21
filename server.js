const { app } = require('./appSetup.js');
const { config } = require('./includes/config/mainConfig.js');

app.listen(config.server.port, () => {
	console.log(`Hotel Booking API running on port ${config.server.port}`);
});
