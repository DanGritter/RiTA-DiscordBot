// -----------------
// Global variables
// -----------------

// codebeat:disable[LOC,ABC,BLOCK_NESTING,ARITY]
const botSend = require("../core/send");
const fn = require("../core/helpers");
const db = require("../core/db");
const logger = require("../core/logger");

// -------------------------------
// setup translate group
// -------------------------------
module.exports.main = function(data)
{
   const subcommands = { "add": module.exports.add,
      "list": module.exports.list,
      "remove": module.exports.remove };
   subcommands[data.options.getSubcommand()](data);
};

module.exports.list = function(data)
{
   data.group = {
      name: data.name,
      channel: data.channel,
      lang: data.lang,
      server: data.guild.id
   };

   // --------------------
   // log group data (dev)
   // --------------------

   logger("dev", data.group);
   data.interaction.deferReply({content: "Listing groups",
      ephemeral: true}).then(value =>
   {
      db.getGroup(data.group,(err,result)=>
      {
         if (err)
         {
            data.interaction.followUp({content: "Couldn't list group",
               ephemeral: true});
         }
         else
         if (result.length > 0)
         {
            let text = "";
            result.forEach(row =>
            {
               if (row.dataValues.active)
               {
                  text += `${row.dataValues.server}.${row.dataValues.name}: ${row.dataValues.channel} in ${row.dataValues.lang} \n`;
               }
               else
               {
                  text += `${row.dataValues.server}.${row.dataValues.name}: ${row.dataValues.channel} in ${row.dataValues.lang} (inactive) \n`;
               }
            });
            data.interaction.followUp({content: text,
               ephemeral: true});
         }
         else
         {
            data.interaction.followUp({content: "No groups defined",
               ephemeral: true});
         }
      });
   });
};

module.exports.remove = function(data)
{
   // ------------------
   // Prepare group data
   // ------------------

   data.group = {
      name: data.name,
      channel: data.channel,
      lang: data.lang,
      server: data.guild.id
   };

   // --------------------
   // log group data (dev)
   // --------------------
   logger("dev", data.group);
   data.interaction.deferReply({content: "Removing group",
      ephemeral: true}).then(value =>
   {
      db.remGroup(data.group,err =>
      {
         if (err)
         {
            data.interaction.followUp({content: `Couldn't remove group - ${err}`,
               ephemeral: true});
         }
         else
         {
            data.interaction.followUp({content: "Group removed",
               ephemeral: true});
         }
      });
   });
};

module.exports.add = function(data)
{
   // ------------------
   // Prepare group data
   // ------------------
   data.interaction.deferReply({content: "Adding group",
      ephemeral: true}).then(value =>
   {
      const grouplookup = {
         name: data.name,
         server: data.guild.id
      };
      data.group = {
         name: data.name,
         channel: data.channel ? data.channel.id : null,
         lang: data.lang,
         server: data.guild.id
      };

      // --------------------
      // log group data (dev)
      // --------------------

      logger("dev", data.group);

      // ------------------------------------------
      // Error if non-manager sets channel as dest
      // ------------------------------------------
      function addGroup(data)
      {
         db.addGroup(data.group,err =>
         {
            if (err)
            {
               data.interaction.followUp({content: `Couldn't add group - ${err}`,
                  ephemeral: true});
            }
            else
            {
               data.interaction.followUp({content: "Group added",
                  ephemeral: true});
            }
         });
      }
      db.getGroup(grouplookup,(err,result)=>
      {
         if (result.length > 0)
         {
            db.getGroup(data.group,(err,result)=>
            {
               if (result.length > 0)
               {
                  data.interaction.followUp({content: `Couldn't add group - already exists for this language or channel`,
                     ephemeral: true});
               }
               else
               {
                  addGroup(data);
               }
            });
         }
         else
         {
            db.getGroupsCount(data.group, function(err, res)
            {
               if (err)
               {
                  logger("error", err);
               }

               const groupCount = res[Object.keys(res)[0]];

               if (groupCount + 1 >= data.config.maxGroupsPerGuild)
               {
                  const text =
            ":no_entry:  Cannot add more auto-translation groups for this " +
            `channel (${data.config.maxGroupsPerGuild} max)`;

                  // -------------
                  // Send message
                  // -------------
                  data.interaction.followUp({content: text,
                     ephemeral: true});
               }
               addGroup(data);
            });
         }
      });
   });
};
