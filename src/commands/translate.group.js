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

module.exports.add = function(data)
{
   // -------------------------------------------------
   // Disallow this command in Direct/Private messages
   // -------------------------------------------------

   if (data.message.channel.type === "dm")
   {
      data.color = "error";
      data.text =
         ":no_entry:  This command can only be called in server channels.";

      // -------------
      // Send message
      // -------------

      return botSend(data);
   }

   // ------------------
   // Prepare task data
   // ------------------

   data.group = {
      name: data.name,
      channel: data.channel,
      lang: data.lang,
      server: data.guild
   };

   // --------------------
   // log task data (dev)
   // --------------------

   logger("dev", data.group);

   // ------------------------------------------
   // Error if non-manager sets channel as dest
   // ------------------------------------------

   if (data.cmd.for[0] !== "me" && !data.message.isManager)
   {
      data.color = "error";
      data.text =
         ":cop:  You need to be a channel manager to " +
         "auto translate for others.";

      // -------------
      // Send message
      // -------------

      return botSend(data);
   }

   // -----------------------------------------------
   // Error if channel exceeds maximum allowed tasks
   // -----------------------------------------------

   db.getTasksCount(data.task.origin, function(err, res)
   {
      if (err)
      {
         logger("error", err);
      }

      const taskCount = res[Object.keys(res)[0]];

      if (data.task.for.length + taskCount >= data.config.maxTasksPerChannel)
      {
         data.color = "error";
         data.text =
            ":no_entry:  Cannot add more auto-translation tasks for this " +
            `channel (${data.config.maxTasksPerChannel} max)`;

         // -------------
         // Send message
         // -------------

         return botSend(data);
      }
   });
};

module.exports.remove = function(data)
{
   // -------------------------------------------------
   // Disallow this command in Direct/Private messages
   // -------------------------------------------------

   if (data.message.channel.type === "dm")
   {
      data.color = "error";
      data.text =
         ":no_entry:  This command can only be called in server channels.";

      // -------------
      // Send message
      // -------------

      return botSend(data);
   }

   // ------------------
   // Prepare task data
   // ------------------

   data.group = {
      name: data.name,
      channel: data.channel,
      lang: data.lang,
      server: data.guild
   };

   // --------------------
   // log task data (dev)
   // --------------------

   logger("dev", data.group);

   // ------------------------------------------
   // Error if non-manager sets channel as dest
   // ------------------------------------------

   if (data.cmd.for[0] !== "me" && !data.message.isManager)
   {
      data.color = "error";
      data.text =
         ":cop:  You need to be a channel manager to " +
         "auto translate for others.";

      // -------------
      // Send message
      // -------------

      return botSend(data);
   }

   // -----------------------------------------------
   // Error if channel exceeds maximum allowed tasks
   // -----------------------------------------------
};

module.exports.list = function(data)
{
   // -------------------------------------------------
   // Disallow this command in Direct/Private messages
   // -------------------------------------------------

   if (data.message.channel.type === "dm")
   {
      data.color = "error";
      data.text =
         ":no_entry:  This command can only be called in server channels.";

      // -------------
      // Send message
      // -------------

      return botSend(data);
   }

   // ------------------
   // Prepare task data
   // ------------------

   data.group = {
      name: data.name,
      channel: data.channel,
      lang: data.lang,
      server: data.guild
   };

   // --------------------
   // log task data (dev)
   // --------------------

   logger("dev", data.group);

   // ------------------------------------------
   // Error if non-manager sets channel as dest
   // ------------------------------------------

   if (data.cmd.for[0] !== "me" && !data.message.isManager)
   {
      data.color = "error";
      data.text =
         ":cop:  You need to be a channel manager to " +
         "auto translate for others.";

      // -------------
      // Send message
      // -------------

      return botSend(data);
   }


   db.getGroupsCount(data.task.origin, function(err, res)
   {
      if (err)
      {
         logger("error", err);
      }

      const groupCount = res[Object.keys(res)[0]];

      if (data.task.for.length + groupCount >= data.config.maxGroupsPerChannel)
      {
         data.color = "error";
         data.text =
            ":no_entry:  Cannot add more auto-translation tasks for this " +
            `channel (${data.config.maxTasksPerChannel} max)`;

         // -------------
         // Send message
         // -------------

         return botSend(data);
      }
   });
};
