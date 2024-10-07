// -----------------
// Global variables
// -----------------

// codebeat:disable[LOC,ABC,BLOCK_NESTING,ARITY]
const botSend = require("../core/send");
const fn = require("../core/helpers");
const db = require("../core/db");
const logger = require("../core/logger");
const translate = require("../core/translate");
const auto = require("./translate.auto");
const { PermissionFlagsBits } = require("discord.js");

// -------------------------------
// setup translate group
// -------------------------------
module.exports = function(data)
{
   data.interaction.deferReply({content: "Setting up channels",
      ephemeral: true}).then(value =>
   {
      if (data.welcome)
      {
	   db.updateServerWelcomeChannel(data.interaction.guild.id, data.welcome.id, cbdata=>
         {
            data.interaction.followUp({content: `set welcome channel to ${data.welcome}`,
               ephemeral: true});
	   });
      }

      if (data.setup)
      {
	   db.updateServerSetupChannel(data.interaction.guild.id, data.setup.id, cbdata=>
         {
            data.interaction.followUp({content: `set setup channel to ${data.setup}`,
               ephemeral: true});
	   });
      }
   });
};
