// -----------------
// Global variables
// -----------------

// codebeat:disable[LOC,ABC,BLOCK_NESTING]
const stripIndent = require("common-tags").stripIndent;
const oneLine = require("common-tags").oneLine;
const auth = require("./core/auth");
const logger = require("./core/logger");
const { messageHandler, alliances, languages} = require("./message");
const db = require("./core/db");
const setStatus = require("./core/status");
const react = require("./commands/translate.react");
const botVersion = require("../package.json").version;
const { Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, StringSelectMenuBuilder,StringSelectMenuOptionBuilder, TextInputStyle, Events } = require("discord.js");

const botCreator = "Collaboration";

// ----------
// Core Code
// ----------

exports.listen = function(client)
{
   var config;

   // -----------------
   // Client Connected
   // -----------------

   client.on("ready", () =>
   {
      db.initializeDatabase();

      // -----------------
      // Default Settings
      // -----------------

      config = {
         version: botVersion,
         botServer: "https://discord.gg/mgNR64R",
         inviteURL: auth.invite || "Set this in your .env file / config variables in Heroku",
         owner: auth.botOwner,
         defaultLanguage: "en",
         translateCmd: "!translate",
         translateCmdShort: "!t",
         clearCmd: "!clear",
         setupCmd: "!setup",
         maxMulti: 6,
         maxChains: 10,
         maxChainLen: 5,
         maxEmbeds: 5,
         maxTasksPerChannel: 10
      };

      let shard = client.shard;

      if (!shard)
      {
         shard = {
            id: 0,
            count: 1
         };
      }

      if (shard.id === 0)
      {
         console.log(stripIndent`
            ----------------------------------------
            @${client.user.username} Bot is now online
            V.${config.version} | ID: ${client.user.id}
            Made by: ${botCreator}
            ----------------------------------------
         `);
      }

      setStatus(client.user, "online", config);

      // ----------------------
      // All shards are online
      // ----------------------

      if (shard.id === shard.count - 1)
      {
         // ---------------------
         // Log connection event
         // ---------------------

         console.log(stripIndent`
            ----------------------------------------
            All shards are online, running intervals
            ----------------------------------------
         `);

         logger("custom", {
            color: "ok",
            msg: oneLine`
               :wave:  **${client.user.username}**
               is now online - \`v.${botVersion}\` -
               **${shard.count}** shards
            `
         });
      }
   });

   // -----------------
   // Recieved Message
   // -----------------

   client.on("messageCreate", message =>
   {
      //if (message.guild)
      //{
      //   console.log(`${message.guild.name} - ${message.guild.id}`);
      //}
      global.message = message;
      messageHandler(config, message);
   });

   // -----------------------------------------------------------
   //  Message edit, Will be fully implemented in future release
   // -----------------------------------------------------------

   //client.on("messageUpdate", (oldMessage, newMessage) =>
   //{
   //   messageHandler(config, oldMessage, newMessage);
   //});

   // ---------------
   // Message delete
   // ---------------

   //client.on("messageDelete", (message) =>
   //{
   //   messageHandler(config, message, null, true);
   //});

   // -----------
   // Raw events
   // -----------

   client.on(Events.MessageReactionAdd, async (message,user) =>
   {
      if (message.partial)
      {
         // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
         try
         {
            await message.fetch();
         }
         catch (error)
         {
            console.error("Something went wrong when fetching the message:", error);
            // Return as `reaction.message.author` may be undefined/null
            return;
         }
      }
      react(message, user,client);
   });

   // ---------------------------
   // Log Client Errors/Warnings
   // ---------------------------

   client.on("error", err =>
   {
      return logger("error", err);
   });

   client.on("warning", info =>
   {
      return logger("warn", info);
   });

   client.on("guildMemberRemove", guildmember =>
   {
      const channel = guildmember.guild.channels.cache.get("1271530367794548739");
      channel.send({
         content: `${guildmember} has left the server!`
      });
   });

   // ------------------------
   // Proccess-related errors
   // ------------------------

   process.on("uncaughtException", err =>
   {
      logger("dev", err);
      return logger("error", err, "uncaught");
   });

   process.on("unhandledRejection", (reason) =>
   {
      const err = `Unhandled Rejection` +
           `\nCaused By:\n` + reason.stack;
      logger("dev", err);
      return logger("error", err, "unhandled");
   });

   process.on("warning", warning =>
   {
      logger("dev", warning);
      return logger("error", warning, "warning");
   });

   // ---------------------------
   // Delete/leave/change events
   // ---------------------------

   client.on("channelDelete", channel =>
   {
      db.removeTask(channel.id, "all", function(err)
      {
         if (err)
         {
            return logger("error", err);
         }
      });
   });

   client.on("guildDelete", guild =>
   {
      logger("guildLeave", guild);
      db.removeServer(guild.id);
   });

   client.on("guildUnavailable", guild =>
   {
      return logger("warn", "Guild unavailable:" + guild.id);
   });

   // -----------
   // Guild join
   // -----------

   client.on("guildCreate", guild =>
   {
      logger("guildJoin", guild);
      db.addServer(guild.id, config.defaultLanguage, db.Servers);
   });

   client.on("guildMemberAdd", guildmember =>
   {
      setTimeout(function ()
      {
         const channel = guildmember.guild.channels.cache.get("1271530367794548739");
         channel.send(stripIndent`
                    Welcome to ${guildmember.guild} ${guildmember}!
                    Willkommen bei ${guildmember.guild}
                    добро пожаловать ${guildmember.guild}
              
                    Please go to <#1272664168750911520> to setup languages and alliance!
                    Пожалуйста, перейдите по ссылке <#1272664168750911520>, чтобы настроить языки и альянс!
                    Bitte gehen Sie zu <#1272664168750911520>, um Sprachen und Allianzen einzurichten!  `);
      }, 3000);
   });

   client.on("interactionCreate", async(interaction) =>
   {
      if (interaction.customId === "ap_alliances" || interaction.customId === "ap_languages")
      {
         const v_userrole = interaction.values[0];
         const guild = interaction.guild;
         const member = interaction.member;
         if (interaction.customId === "ap_languages")
         {
            for (const language of languages)
            {
               member.roles.remove(guild.roles.cache.find(r => r.name === language));
            }
         }
         else if (interaction.customId === "ap_alliances")
         {
            for (const alliance of alliances)
            {
               member.roles.remove(guild.roles.cache.find(r => r.name === alliance));
            }
         }
         const role = guild.roles.cache.find(r => r.name === v_userrole);
         member.roles.add(role);

         interaction.reply({
            content: `Thank you / Danke / Спасибо`,
            ephemeral: true
         }).then((sent) =>
         {
            setTimeout(function ()
            {
               sent.delete();
            }, 2500);
         });
      }
   });
};
