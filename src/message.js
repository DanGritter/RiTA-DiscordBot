// -----------------
// Global variables
// -----------------

// codebeat:disable[LOC,ABC,BLOCK_NESTING]
const db = require("./core/db");
const fn = require("./core/helpers");
const auth = require("./core/auth");
const events = require("./events");
const autoTranslate = require("./core/auto");
const { ParseArgs} = require("./commands/args");
const { alliances, languages, language_labels, ranks} = require("./core/languages");
const { Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, StringSelectMenuBuilder,StringSelectMenuOptionBuilder, TextInputStyle, PermissionsBitField, ChannelType } = require("discord.js");
const stripIndent = require("common-tags").stripIndent;

// --------------------
// Listen for messages
// --------------------

//eslint-disable-next-line no-unused-vars
module.exports.messageHandler = async function(config, message, edited, deleted)
{
   module.exports.message = message;
   const client = message.client;
   const bot = client.user;

   // ------------------------
   // Ignore messages by bots
   // ------------------------

   if (message.author.bot)
   {
      return;
   }

   // -----------------------------------------
   // Embed member permissions in message data
   // -----------------------------------------
   if (message.channel.type === ChannelType.GuildText && message.member)
   {
      message.isAdmin =
         message.member.permissionsIn(message.channel).has(PermissionsBitField.Flags.Administrator);

      message.isManager =
         message.member.permissionsIn(message.channel).has(PermissionsBitField.Flags.ManageChannels);
      // Add role color
      message.roleColor = fn.getRoleColor(message.member);
   }

   // ------------
   // Data object
   // ------------

   const data = {
      client: client,
      config: config,
      bot: bot,
      message: message,
      canWrite: true
   };

   // ------------------
   // Proccess Commands
   // ------------------

   if (
      message.content.startsWith(config.translateCmd) ||
      message.content.startsWith(config.translateCmdShort) ||
      message.mentions.members.has(bot)
   )
   {
      return ParseArgs(data);
   }
   if (
      message.content.startsWith("!nickname")
   )
   {
      if (message.isAdmin)
      {
         message.guild.members.fetch().then(members=>
         {
            members.each(member =>
            {
               if (member.id !== message.guild.ownerId)
               {
                  events.nickname(member);
               }
            });
         });
         message.reply({content: `Nicknames updated`,
            ephemeral: true});
      }
      else
      {
         message.reply({content: `Not allowed to set nicknames`,
            ephemeral: true});
      }
      return;
   }
   if (
      message.content.startsWith(config.clearCmd)
   )
   {
      if (message.isAdmin)
      {
         message.channel.bulkDelete(100, true).then((_message) =>
         {
            message.reply({content: `Bot cleared \`${_message.size}\` messages :broom:`,
               ephemeral: true}).then((sent) =>
            {
               setTimeout(function ()
               {
                  sent.delete();
               }, 2500);
            });
         });
      }
      else
      {
         message.reply({content: `Not allowed to clear messages!`,
            ephemeral: true});
      }
      return;
   }
   if (
      message.content.startsWith(config.setupCmd)
   )
   {
      const alliance_options = [];
      const language_options = [];
      const rank_options = [];
      const rolesToAdd = [];
      for (var e of alliances)
      {
         alliance_options.push(new StringSelectMenuOptionBuilder()
            .setLabel(e)
            .setValue(e));
         rolesToAdd.push(e);
      }
      for (var l in languages)
      {
         language_options.push(new StringSelectMenuOptionBuilder()
            .setLabel(language_labels[l])
            .setValue(languages[l]));
         rolesToAdd.push(languages[l]);
      }
      for (var r in ranks)
      {
         rank_options.push(new StringSelectMenuOptionBuilder()
            .setLabel(ranks[r])
            .setValue(ranks[r]));
         rolesToAdd.push(ranks[r]);
      }
      message.guild.roles.fetch().then(groles =>
      {
         const newRolesToAdd = [];
         rolesToAdd.forEach(r =>
         {
            const missing = groles.every(gr => gr.name !== r);
            if (missing) {newRolesToAdd.push(r);}
         });
         newRolesToAdd.forEach(r =>
         {
            message.guild.roles.create({name: r});
         });
      });

      const user_role = new StringSelectMenuBuilder()
         .setCustomId("ap_alliances")
         .setPlaceholder("Select your alliance!").addOptions(alliance_options);
      const user_language = new StringSelectMenuBuilder()
         .setCustomId("ap_languages")
         .setPlaceholder("Select your language!").addOptions(language_options);
      const user_rank = new StringSelectMenuBuilder()
         .setCustomId("ap_ranks")
         .setPlaceholder("Select your rank!").addOptions(rank_options);
      const btnrow = new ActionRowBuilder().addComponents([
         user_role
      ]);
      const btnrow2 = new ActionRowBuilder().addComponents([
         user_language
      ]);
      const btnrow3 = new ActionRowBuilder().addComponents([
         user_rank
      ]);
      const channel = message.guild.channels.cache.get(auth.setupChannel);
      channel.messages.cache.forEach(message=>
      {
         channel.messages.delete(message);
      });
      channel.send({
         content: stripIndent`
                            Which language do you speak?
                            Welche Sprache sprechen Sie?
                            ¿Qué idioma hablas?
                            あなたは何語を話しますか?
                            Quelle langue parles-tu ?
                            На каком языке вы говорите?
                            คุณพูดภาษาอะไร?
                            Qual o idioma que fala?`,
         components: [btnrow2]
      });
      channel.send({
         content: stripIndent`
                             Which alliance are you in?
                             In welcher Allianz bist du?
                             ¿En qué alianza estás?
                             あなたはどの同盟に属していますか?
                             Dans quelle alliance appartenez-vous ?
                             В каком альянсе вы состоите?
                             คุณอยู่ในพันธมิตรไหน?
                             Em que aliança está?`,
         components: [btnrow]
      });
      channel.send({
         content: stripIndent`
                             Which rank are you?
                             Welchen Rang hast du?
                             ¿Que rango tienes?
                             あなたはどのランクを保持していますか？
                             Quel est votre rang ?
                             Какой у вас ранг?
                             คุณอยู่อันดับที่เท่าไหร่?
                             Em que classificação está?`,
         components: [btnrow3]
      });
      return;
   }
   // --------------------------
   // Check for automatic tasks
   // --------------------------
   return db.channelTasks(data,autoTranslate);
};

