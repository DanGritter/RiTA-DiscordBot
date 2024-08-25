// -----------------
// Global variables
// -----------------

// codebeat:disable[LOC,ABC,BLOCK_NESTING]
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const commands = require("./commands");
const stripIndent = require("common-tags").stripIndent;
const oneLine = require("common-tags").oneLine;
const auth = require("./core/auth");
const logger = require("./core/logger");
const { ParseInteraction} = require("./commands/args");
const { messageHandler} = require("./message");
const { alliances, languages,ranks } = require("./core/languages");                
const db = require("./core/db");
const fn = require("./core/helpers");
const setStatus = require("./core/status");
const react = require("./commands/translate.react");
const botVersion = require("../package.json").version;
const { Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, StringSelectMenuBuilder,StringSelectMenuOptionBuilder, TextInputStyle, Events, ChannelType, PermissionsBitField } = require("discord.js");

const botCreator = "Collaboration";

// ----------
// Core Code
// ----------

async function updateNickname(stalemember)
{
   if (stalemember.guild)
   {
      const member = await stalemember.guild.members.fetch({ user: stalemember.id,
         force: true });
      var nickname = member.displayName;
      if (nickname)
      {
         nickname = member.displayName;
         const regex = /\[.*\].*/;
         if (nickname.match(regex))
         {
            nickname = nickname.substring(nickname.indexOf("]") + 1);
         }
         var user_alliance = null;
         var user_rank = null;
         member.roles.cache.every(role =>
         {
            if (ranks.includes(role.name))
            {
               user_rank = role.name;
            }
            else if (alliances.includes(role.name))
            {
               user_alliance = role.name;
            }
            return true;
         });
         if (user_alliance && user_rank)
         {
            member.setNickname("["+user_alliance + " " + user_rank+"]"+nickname);
         }
      }
   }
}
exports.nickname = updateNickname;

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
         maxTasksPerChannel: 10,
         maxGroupsPerGuild: 30
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
      const rest = new REST({version: "10"}).setToken(auth.token);
      rest.put(
         Routes.applicationCommands(
            auth.clientId,
         ),
         { body: commands }
      ).then(result =>
      {
         console.log("Registered Guild Commands");
      });
      //      const Guilds = client.guilds.cache.each((guild,guildId) =>
      //      {
      //         try
      //         {
      //            rest.put(
      //               Routes.applicationGuildCommands(
      //                  auth.clientId,
      //                  guildId
      //               ),
      //               { body: commands }
      //            ).then(result =>
      //            {
      //               console.log(`Registered Guild Commands for ${guild}.`.green);
      //            });
      //         }
      //         catch (error)
      //         {
      //            console.error(error);
      //         }
      //      });

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

   var timeout = {};

   client.on("guildMemberUpdate", (oldMember,newMember) =>
   {
      // If the role(s) are present on the new member object but are not on the old one (i.e role(s) were added)
      const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
      if (addedRoles.size > 0)
      {
         if (!timeout[newMember.id])
         {
            const timeid = setTimeout(function()
            {
               updateNickname(newMember);
               delete timeout[newMember.id];
            },5000);
            timeout[newMember.id] = timeid;
         }
      }
   });
   client.on("guildMemberRemove", guildmember =>
   {
      const channel = guildmember.guild.channels.cache.get(auth.welcomeChannel);
      if (channel)
      {
         channel.send({
            content: `${guildmember} has left the server!`
         });
      }
      else
      {
         logger("dev", `No welcome channel defined or found: ${auth.welcomeChannel}`);
      }
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
         const channel = guildmember.guild.channels.cache.get(auth.welcomeChannel);
         if (channel)
         {
            channel.send(stripIndent`
                    ${guildmember}
                    добро пожаловать ${guildmember.guild}
                    Пожалуйста, перейдите по ссылке <#${auth.setupChannel}>, чтобы настроить языки и альянс!

                    Welcome to ${guildmember.guild}!
                    Please go to <#${auth.setupChannel}> to setup languages and alliance!
                    ¡Bienvenido a ${guildmember.guild}!
                    ¡Vaya a <#${auth.setupChannel}> para configurar los idiomas y la alianza!

                    ${guildmember.guild} へようこそ!
                    言語と同盟を設定するには、<#${auth.setupChannel}> にアクセスしてください。

                    Willkommen bei ${guildmember.guild}
                    Bitte gehen Sie zu <#${auth.setupChannel}>, um Sprachen und Allianzen einzurichten!`);
         }
         else
         {
            logger("dev", `No welcome channel defined or found: ${auth.welcomeChannel}`);
         }
      }, 3000);
   });

   client.on("interactionCreate", async(interaction) =>
   {
      if (interaction.customId === "ap_alliances" || interaction.customId === "ap_languages" || interaction.customId === "ap_ranks")
      {
         const member = await interaction.guild.members.fetch({ user: interaction.member.id,
            force: true });
         const v_userrole = interaction.values[0];
         const guild = interaction.guild;
         if (interaction.customId === "ap_languages")
         {
            for (const language of languages)
            {
               var exlrole = member.roles.cache.find(r => r.name === language);
               if (exlrole)
               {
                  member.roles.remove(exlrole);
               }
            }
         }
         else if (interaction.customId === "ap_alliances")
         {
            for (const alliance of alliances)
            {
               var exarole = member.roles.cache.find(r => r.name === alliance);
               if (exarole)
               {
                  member.roles.remove(exarole);
               }
            }
         }
         else if (interaction.customId === "ap_ranks")
         {
            for (const rank of ranks)
            {
               var exrrole = member.roles.cache.find(r => r.name === rank);
               if (exrrole)
               {
                  member.roles.remove(exrrole);
               }
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
      if (interaction.isChatInputCommand())
      {
         if (interaction.channel.type === ChannelType.GuildText && interaction.member)
         {
            interaction.isAdmin =
         interaction.member.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.Administrator);

            interaction.isManager =
         interaction.member.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.ManageChannels);
            // Add role color
            interaction.roleColor = fn.getRoleColor(interaction.member);
         }

         if (interaction.commandName === "clear")
         {
            if (interaction.isAdmin)
            {
               interaction.channel.bulkDelete(100, true).then((_message) =>
               {
                  interaction.reply({content: `Bot cleared \`${_message.size}\` messages :broom:`,
                     ephemeral: true,
                     hidden: true}).then((sent) =>
                  {
                     setTimeout(function ()
                     {
                        interaction.deleteReply();
                     }, 2500);
                  });
               });
            }
            else
            {
               interaction.reply({content: `Not allowed to clear messages!`,
                  ephemeral: true}).then((sent) =>
               {
                  setTimeout(function ()
                  {
                     interaction.deleteReply();
                  }, 2500);
               });
            }
            return;
         }
         ParseInteraction({interaction: interaction,
            commandName: interaction.commandName,
            options: interaction.options,
            config: config });
      }
   });
};
