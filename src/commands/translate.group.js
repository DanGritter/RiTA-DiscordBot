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


function createChannel(data,cb)
{
   const channelName = data.group.name;
   if (data.group.channelname)
   {
      fn.createChannel(data.interaction.guild,data.group.channelname, cb);
   }
   else
   if (data.group.lang !== "en")
   {
      const tdata = { translate: { to: data.lang,
         from: "auto",
         original: data.group.name
      },
      channel: data.interaction.channel,
      };
      translate(tdata, result =>
      {
         if (result.text !== data.group.name) {
         fn.createChannel(data.interaction.guild,result.text, cb);
        } else {
         fn.createChannel(data.interaction.guild, data.group.name + "-" + data.group.lang, cb);
        }
      });
   }
   else
   {
      fn.createChannel(data.interaction.guild,channelName, cb);
   }
}

// -------------------------------
// setup translate group
// -------------------------------
module.exports.main = function(data)
{
   const subcommands = { "add": module.exports.add,
      "list": module.exports.list,
      "remove": module.exports.remove,
      "setup": module.exports.setup,
   };
   subcommands[data.options.getSubcommand()](data);
};

module.exports.setup = function(data)
{
   data.group = {
      name: data.name,
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
            data.interaction.followUp({content: `Couldn't find group: + ${err}`,
               ephemeral: true});
         }
         else
         if (result.length > 0)
         {
            let rows = [];
            result.forEach(row =>
            {
               if (row.dataValues.active)
               {
                rows.push(row.dataValues);
               }
            });
            rows.forEach( row => {
               rows.forEach( row2 => {
   db.checkTask(origin, dest, function(err, res)
   {

      if (!res || res.length < 1) {
      } else {
                  db.removeTask(res, data, origin, dest, destDisplay);
      }
   });

	       })
	    })
            rows.forEach( row => {
               rows.forEach( row2 => {
                  if (row.channel !== row2.channel) {
                    data.task = {
                       origin: row.channel,             
                       for: `<#${row2.channel}>`,
                       dest: [],
                       invalid: [],
                       from: row.lang,
                       to: row2.lang,
                       server: row.server,
                    };
                    auto.validateTask(data, result => {
                       console.log("validation created for ${data.task}");
		    });
                }
              });
           });
           data.interaction.followUp({content: "Updating tasks!",
               ephemeral: true});
         }
         else
         {
            data.interaction.followUp({content: "Couldn't find group in database.",
               ephemeral: true});
         }
      });
   });
};

module.exports.list = function(data)
{
   data.group = {
      name: data.name,
      channel: data.channel ? data.channel.id : null,
      lang: data.lang ? data.lang.valid[0].iso : null,
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
                  text += `${row.dataValues.server}.${row.dataValues.name}: <#${row.dataValues.channel}> in ${row.dataValues.lang} \n`;
               }
               else
               {
                  text += `${row.dataValues.server}.${row.dataValues.name}: <#${row.dataValues.channel}> in ${row.dataValues.lang} (inactive) \n`;
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
      channel: data.channel ? data.channel.id : null,
      lang: data.lang ? data.lang.valid[0].iso : null,
      server: data.guild.id
   };

   // --------------------
   // log group data (dev)
   // --------------------
   logger("dev", data.group);
   data.interaction.deferReply({content: "Removing group",
      ephemeral: true}).then(value =>
   {
      db.remGroup(data.group, count =>
      {
         if (count > 0)
         {
            data.interaction.followUp({content: `Removed ${count} group entries`,
               ephemeral: true});
         }
         else
         {
            data.interaction.followUp({content: "No groups removed",
               ephemeral: true});
         }
      });
   });
};

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
function doAdd(data)
{
   if (data.group.channel)
   {
      addGroup(data);
   }
   else
   {
      createChannel(data, (channel,err) =>
      {
         if (channel)
         {
            data.group.channel = channel.id;
            addGroup(data);
         }
         else
         {
            data.interaction.followUp({content: `Couldn't add group - ${err}`,
               ephemeral: true});
         }
      });
   }
}
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
         lang: data.lang ? data.lang.valid[0].iso : null,
         server: data.guild.id
      };

      // --------------------
      // log group data (dev)
      // --------------------

      logger("dev", data.group);

      // ------------------------------------------
      // Error if non-manager sets channel as dest
      // ------------------------------------------
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
               else {doAdd(data);}
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
               else
               {
                  doAdd(data);
               }
            });
         }
      });
   });
};
