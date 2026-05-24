import os
import telebot
from telebot import types
from flask import Flask, request

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
bot = telebot.TeleBot(TOKEN)
app = Flask(__name__)

GAME_URL = os.environ.get("GAME_URL", "https://onrender.com")

@bot.message_handler(commands=['start'])
def start_message(message):
    markup = types.InlineKeyboardMarkup()
    game_btn = types.InlineKeyboardButton(
        text="🎮 Play Floor Is Lava", 
        web_app=types.WebAppInfo(url=GAME_URL)
    )
    markup.add(game_btn)
    
    welcome_text = (
        "🌋 *Welcome to Floor Is Lava!* 🌋\n\n"
        "Platforms are cracking and collapsing behind you! Jump high, "
        "collect Star Coins, unlock awesome 3D characters, and spin mega lootboxes! 🚀"
    )
    bot.send_message(message.chat.id, welcome_text, parse_mode="Markdown", reply_markup=markup)

@app.route('/' + TOKEN, methods=['POST'])
def getMessage():
    json_string = request.get_data().decode('utf-8')
    update = telebot.types.Update.de_json(json_string)
    bot.process_new_updates([update])
    return "!", 200

@app.route("/")
def webhook():
    bot.remove_webhook()
    bot.set_webhook(url=os.environ.get("SERVER_URL") + "/" + TOKEN)
    return "Bot Server is Running!", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
