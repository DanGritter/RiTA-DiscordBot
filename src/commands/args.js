// -----------------
// Global variables
// -----------------

// codebeat:disable[LOC,ABC,BLOCK_NESTING,ARITY]
const langCheck = require("../core/lang.check");
const logger = require("../core/logger");
const db = require("../core/db");
const fn = require("../core/helpers");

// ---------
// Commands
// ---------

const cmdHelp = require("./help");
const cmdList = require("./list");
const cmdStats = require("./stats");
const cmdVersion = require("./version");
const cmdEmbed = require("./embed");
const cmdMisc = require("./misc");
const cmdSettings = require("./settings");
const cmdTranslateLast = require("./translate.last");
const cmdTranslateThis = require("./translate.this");
const cmdTranslateAuto = require("./translate.auto");
const cmdTranslateGroup = require("./translate.group");
const cmdTranslateStop = require("./translate.stop");
const cmdTranslateTasks = require("./translate.tasks");

const cmdMap = {
   "this": cmdTranslateThis,
   "last": cmdTranslateLast,
   "auto": cmdTranslateAuto,
   "group": cmdTranslateGroup,
   "stop": cmdTranslateStop,
   "tasks": cmdTranslateTasks,
   "help": cmdHelp,
   "info": cmdHelp,
   "list": cmdList,
   "stats": cmdStats,
   "embed": cmdEmbed.run,
   "version": cmdVersion,
   "invite": cmdMisc.invite,
   "shards": cmdMisc.shards,
   "proc": cmdMisc.proc,
   "settings": cmdSettings
};

// ---------------------------------------
// Extract a parameter's value with regex
// ---------------------------------------

const extractParam = function(key, str, def = null, allowArray = false)
{
   const rgx = new RegExp(`${key}\\s*((?:(?:\\S*\\s*,\\s*)+\\S*)|\\S*)`, "m");

   const match = rgx.exec(str);

   if (match)
   {
      if (match[1] === "" || match[1] === " ")
      {
         return def;
      }
      if (allowArray)
      {
         return fn.removeDupes(match[1].replace(/\s/igm, "").split(","));
      }
      return match[1];
   }
   return def;
};

// ---------------------
// Extract number param
// ---------------------

const extractNum = function(str)
{
   const rgx = new RegExp("(?:^\\s*(-?\\d+))|(?:[^,]\\s*(-?\\d+))", "im");

   const match = rgx.exec(str);

   if (match)
   {
      if (match[1])
      {
         return match[1];
      }
      return match[2];
   }
   return null;
};

// ------------------
// Check for content
// ------------------

const checkContent = function(msg, output)
{
   const hasContent = (/([^:]*):(.*)/).exec(msg);

   if (hasContent)
   {
      output.main = hasContent[1].trim();
      output.content = hasContent[2].trim();
   }
};

// -------------
// Get main arg
// -------------

const getMainArg = function(output)
{
   const sepIndex = output.main.indexOf(" ");

   if (sepIndex > -1)
   {
      output.params = output.main.slice(sepIndex + 1);
      output.main = output.main.slice(0, sepIndex);
   }
};

// -------------
// Strip prefix
// -------------

const stripPrefix = function(message, config, bot)
{
   let cmd = message.content;

   cmd = cmd.replace(config.translateCmd, "");
   cmd = cmd.replace(config.translateCmdShort, "");

   if (cmd.startsWith(bot))
   {
      cmd = cmd.replace(bot, "");
   }

   return cmd;
};

module.exports.ParseInteraction = function(data)
{
   var output = {
      main: data.commandName,
      params: null
   };

   if (output.main === "channel")
   {
      output.auto = output.main;
      output.main = "auto";
   }

   if (output.main === "group")
   {
      console.log("group");
   }
   else
   if (data.options.data.length > 0)
   {
      output.to = data.options.getString("to");
      output.from = data.options.getString("from");
      output.for = data.options.getString("for");
      output.num = data.options.getInteger("num");
   }
   data.cmd = output;
   if (Object.prototype.hasOwnProperty.call(cmdMap,output.main))
   {
      cmdMap[output.main](data);
   }
};

// --------------------------------------
// Analyze arguments from command string
// --------------------------------------

module.exports.ParseArgs = function(data)
{
   var output = {
      main: stripPrefix(data.message, data.config, `${data.bot}`).trim(),
      params: null
   };

   checkContent(output.main, output);

   getMainArg(output);

   if (output.main === "channel")
   {
      output.auto = output.main;
      output.main = "auto";
   }

   if (output.main === `${data.bot}`)
   {
      output.main = "help";
   }

   output.to = langCheck(extractParam("to", output.params, "default", true));

   output.from = langCheck(extractParam("from", output.params, "auto", true));

   output.for = extractParam("for", output.params, ["me"], true);

   output.num = extractNum(output.params);

   // -----------------------------
   // Get server/bot info/settings
   // -----------------------------

   var id = "bot";

   if (data.message.channel.type === "text")
   {
      id = data.message.channel.guild.id;
   }

   db.getServerInfo(id, function(server)
   {
      output.server = server;

      // -----------------------------------
      // Get default language of server/bot
      // -----------------------------------

      if (output.to === "default")
      {
         if (server && server.lang)
         {
            output.to = langCheck(server.lang);
         }
         else
         {
            output.to = langCheck(data.config.defaultLanguage);
         }
      }

      // ----------------------------------
      // Add command info to main data var
      // ----------------------------------

      data.cmd = output;

      // -----------------------------
      // check if channel is writable
      // -----------------------------

      data.canWrite = true;

      if (data.message.channel.type === "text")
      {
         data.canWrite = fn.checkPerm(
            data.message.channel.guild.me,
            data.message.channel,
            "SEND_MESSAGES"
         );
      }

      // -----------------------
      // log command data (dev)
      // -----------------------

      logger("cmd", data);

      // ---------------
      // Legal Commands
      // ---------------


      // --------------------------
      // Execute command if exists
      // --------------------------

      output.main = output.main.toLowerCase();

      if (Object.prototype.hasOwnProperty.call(cmdMap,output.main))
      {
         cmdMap[output.main](data);
      }
   });
};
