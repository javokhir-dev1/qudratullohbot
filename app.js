const sequelize = require("./config/db");
const { Telegraf, Markup } = require("telegraf")

const dotenv = require("dotenv")

dotenv.config()

const Message = require("./models/message.model")
const User = require("./models/users.model")

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start(async (ctx) => {
    try {
        console.log(await User.findAll())
        ctx.reply("Statistikani korish uchun:",
            Markup.inlineKeyboard([
                [Markup.button.callback("Statistics", "get_statistics")]
            ])
        );
    } catch (err) {
        ctx.reply("start qilishda xatolik")
        console.log(err)
    }
});

bot.command("soni", async (ctx) => {
    const group_id = String(ctx.chat.id);
    await sendStatistics(ctx, group_id)
})


async function sendStatistics(ctx, group_id) {
    try {
        const users = await User.findAll({ where: { group_id } });
        text = ""

        for (let i = 0; i < users.length; i++) {
            const messages = await Message.findAll({ where: { user_id: users[i].user_id, group_id } });
            const messageCount = messages.length;


            text += `👤 ${users[i].username}\n${messageCount}ta \n`
        }

        await ctx.reply(text || "Userlar topilmadi");
    } catch (err) {
        console.log("Statisticsni chiqarishda xatolik:", err);
        ctx.reply("Statisticsni chiqarishda xatolik yuz berdi ❌");
    }
}

bot.action("get_statistics", async (ctx) => {
    await ctx.answerCbQuery();
    const group_id = String(ctx.chat.id);
    await sendStatistics(ctx, group_id);
});


bot.action(/get_messages_(\d+)/, async (ctx) => {
    try {
        await ctx.answerCbQuery();

        const userId = ctx.match[1];
        const user = await User.findOne({ where: { user_id: userId } })
        const messages = await Message.findAll({ where: { user_id: userId } });

        await ctx.reply(`${user.username} habarlari:`)
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            await ctx.replyWithPhoto(msg.file_id, {
                caption: `${i + 1}) ${msg.caption || ""}`,
                ...Markup.inlineKeyboard([
                    [Markup.button.callback("habarni ochirish", `delete_message_${msg.id}`)]
                ])
            });

        }
    } catch (err) {
        ctx.reply("messagelarni olishda xatolik")
        console.log(err)
    }
});

bot.action(/delete_message_(\d+)/, async (ctx) => {
    try {
        await ctx.answerCbQuery();
        const message_id = ctx.match[1];

        const message = await Message.findOne({ where: { id: message_id } })

        if (message) {
            await message.destroy();
            await ctx.deleteMessage();
            await ctx.answerCbQuery("Habar o'chirildi ✅", { show_alert: true });
        }
    } catch (err) {
        ctx.reply("botni ochirishda xatolik")
        console.log(err)
    }
})

bot.on("message", async (ctx) => {
    try {
        if (ctx.chat.type == "group" || ctx.chat.type == "supergroup") {
            if (ctx.message.photo) {
                const group_id = String(ctx.chat.id)
                const user = ctx.from
                const user_id = String(user.id)
                const first_name = user.first_name
                const username = user.username || ""

                const photo = ctx.message.photo.at(-1)
                const file_id = photo.file_id
                const caption = ctx.message.caption || ""

                await User.findOrCreate({
                    where: { user_id, group_id },
                    defaults: { first_name, username }
                });
                await Message.create({ user_id, file_id, caption, group_id })
            }
        }
    } catch (err) {
        ctx.reply("habarni qoshishda xatolik")
        console.log(err)
    }
});

(async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true })
        console.log("connected to database");
        console.log("bot started successfully")
        bot.launch();
    } catch (error) {
        console.error("ulanishda xatolik:", error);
    }
})();