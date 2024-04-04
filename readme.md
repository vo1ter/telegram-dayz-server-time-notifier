# Telegram DayZ Server Time Notifier Bot

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/vo1ter/telegram-dayz-server-time-notifier
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your Telegram Bot Token:
   ```plaintext
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   ```

4. Start the bot:
   ```bash
   npm start
   ```

## Usage

- To subscribe to notifications for a server time, use the following command:
   ```
   /notify [ip]:[port] [hour:minute]
   ```

- To unsubscribe from notifications, use:
   ```
   /unsubscribe
   ```

- The bot will notify you when the specified server time is reached.