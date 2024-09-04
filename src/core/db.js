// -----------------
// Global variables
// -----------------

// codebeat:disable[LOC,ABC,BLOCK_NESTING,ARITY]
const Sequelize = require("sequelize");
const logger = require("./logger");
const Op = Sequelize.Op;
var dbEmbedValue ="";
var dbBot2BotValue ="";

// ----------------------
// Database Auth Process
// ----------------------

const db = process.env.DATABASE_URL.endsWith(".db") ?
   new Sequelize({
      dialect: "sqlite",
      dialectOptions: {
         ssl: {
            require: true,
            rejectUnauthorized: false
         }
      },
      storage: process.env.DATABASE_URL
   }) :
   new Sequelize(process.env.DATABASE_URL, {
   //   logging: console.log,
      dialectOptions: {
         ssl: {
            require: true,
            rejectUnauthorized: false
         }
      }
      //logging: null,
   });

db
   .authenticate()
   .then(() =>
   {
      logger("dev","Successfully connected to database");
   })
   .catch(err =>
   {
      logger("error", err);
   });

// ---------------------------------
// Database server table definition
// ---------------------------------

const Servers = db.define("servers", {
   id: {
      type: Sequelize.STRING(32),
      primaryKey: true,
      unique: true,
      allowNull: false
   },
   lang: {
      type: Sequelize.STRING(8),
      defaultValue: "en"
   },
   count: {
      type: Sequelize.INTEGER,
      defaultValue: 0
   },
   active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
   },
   embedstyle: {
      type: Sequelize.STRING(8),
      defaultValue: "on"
   },
   bot2botstyle: {
      type: Sequelize.STRING(8),
      defaultValue: "off"
   }
});

// --------------------------------
// Database tasks table definition
// --------------------------------

const Groups = db.define("groups", {
   server: Sequelize.STRING(32),
   name: Sequelize.STRING(32),
   channel: Sequelize.STRING(32),
   active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
   },
   lang: {
      type: Sequelize.STRING(8),
      defaultValue: "en"
   }
},
{
   indexes: [
      {
         unique: false,
         fields: ["channel", "name"]
      }
   ]
});

// --------------------------------
// Database tasks table definition
// --------------------------------

const Tasks = db.define("tasks", {
   origin: Sequelize.STRING(32),
   dest: Sequelize.STRING(32),
   reply: Sequelize.STRING(32),
   server: Sequelize.STRING(32),
   active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
   },
   LangTo: {
      type: Sequelize.STRING(8),
      defaultValue: "en"
   },
   LangFrom: {
      type: Sequelize.STRING(8),
      defaultValue: "en"
   }
},
{
   indexes: [
      {
         unique: true,
         fields: ["origin", "dest"]
      }
   ]
});

// -------------------
// Init/create tables
// -------------------

exports.initializeDatabase = function()
{
   Servers.sync({ logging: console.log });
   Tasks.sync({ logging: console.log });
   Groups.sync({ logging: console.log });
   // Add global server row
   Servers.upsert({ id: "bot",
      lang: "en" });
};

// -----------------------
// Add Server to Database
// -----------------------

exports.addServer = function(id, lang)
{
   return Servers.create({
      id: id,
      lang: lang
   });
};

// ------------------
// Deactivate Server
// ------------------

exports.removeServer = function(id)
{
   return Servers.update({ active: false }, { where: { id: id } }).then(
      function (err, _result)
      {
         logger("error", err);
      });
};

// -------------------
// Update Server Lang
// -------------------

exports.updateServerLang = function(id, lang, _cb)
{
   return Servers.update({ lang: lang }, { where: { id: id } }).then(
      function ()
      {
         _cb();
      });
};

// -------------------------------
// Update Embedded Variable in DB
// -------------------------------

exports.updateEmbedVar = function(id, embedstyle, _cb)
{
   dbEmbedValue = embedstyle;
   return Servers.update({ embedstyle: embedstyle }, { where: { id: id } }).then(
      function ()
      {
         _cb();
      });
};

// ------------------------------
// Get Embedded Variable From DB
// ------------------------------

exports.getEmbedVar = async function run(id)
{
   var value = await db.query(`select * from (select embedstyle as "embedstyle" from servers where id = ?) as table1`, { replacements: [id],
      type: db.QueryTypes.SELECT});
   dbEmbedValue = value[0].embedstyle;
   return this.setEmbedVar();
};

// -------------------------------------------
// Call Saved Embedded Variable Value From DB
// -------------------------------------------

module.exports.setEmbedVar = function(data)
{
   return dbEmbedValue;
};


// ------------------------------
// Update Bot2Bot Variable In DB
// ------------------------------

exports.updateBot2BotVar = function(id, bot2botstyle, _cb)
{
   dbBot2BotValue = bot2botstyle;
   return Servers.update({ bot2botstyle: bot2botstyle }, { where: { id: id } }).then(
      function ()
      {
         _cb();
      });
};

// -----------------------------
// Get Bot2Bot Variable From DB
// -----------------------------

exports.getBot2BotVar = async function run(id)
{
   var value = await db.query(`select * from (select bot2botstyle as "bot2botstyle" from servers where id = ?) as table2`, { replacements: [id],
      type: db.QueryTypes.SELECT});
   dbBot2BotValue = value[0].bot2botstyle;
   return this.setBot2BotVar();
};

// ------------------------------------------
// Call Saved Bot2Bot Variable Value From DB
// ------------------------------------------

module.exports.setBot2BotVar = function(data)
{
   return dbBot2BotValue;
};

// -----------------------------
// Add Missing Variable Columns
// -----------------------------

exports.updateColumns = function(data)
{
   // Very sloppy code, neew to find a better fix.
   db.query(`ALTER TABLE public.servers ADD COLUMN "embedstyle" character varying(8) COLLATE pg_catalog."default" DEFAULT 'on'::character varying;`,function(err)
   {
      if (err)
      {
         console.log("ERROR:"+err.message);
      }
      else
      {
         console.log("embedstyle column added");
      }
   });
   db.query(`ALTER TABLE public.servers ADD COLUMN "bot2botstyle" character varying(8) COLLATE pg_catalog."default" DEFAULT 'off'::character varying;`,function(err)
   {
      if (err)
      {
         console.log("ERROR:"+err.message);
      }
      else
      {
         console.log("bot2botstyle column added");
      }
   });

   // ------------------------------------------
   // Add Missing Variable Columns for local db
   // ------------------------------------------

   db.query(`ALTER TABLE servers ADD COLUMN "embedstyle" character varying(8)  DEFAULT 'on'`,function(err)
   {
      if (err)
      {
         console.log("ERROR:"+err.message);
      }
      else
      {
         console.log("embedstyle column added");
      }
   });
   db.query(`ALTER TABLE servers ADD COLUMN "bot2botstyle" character varying(8) DEFAULT 'off'`,function(err)
   {
      if (err)
      {
         console.log("ERROR:"+err.message);
      }
      else
      {
         console.log("bot2botstyle column added");
      }
   });
};

// ------------------
// Get Channel Groups
// ------------------
exports.groups = function(group)
{
   const taskList = Groups.findAll({ where: { group: group,
      active: true }}).then(
      function (result)
      {
         return result;
      }).
      catch(e =>
      {
         logger("error", e);
         return null;
      });
};

exports.channelTasks = function(data,cb)
{
   var id = data.message.channel.id;
   if (data.message.channel.type === "dm")
   {
      id = "@" + data.message.author.id;
   }
   try
   {
      const taskList = Tasks.findAll({ where: { origin: id,
         active: true }}).then(
         function (result)
         {
            data.rows = result;
            return cb(data);
         });
   }
   catch (e)
   {
      logger("error", e);
      data.err = e;
      return cb(data);
   }
};
// ------------------------------
// Get tasks for channel or user
// ------------------------------

exports.getTasks = function(origin, dest, server, cb)
{
   if (dest === "me")
   {
      return Tasks.findAll({ where: { origin: origin,
         dest: dest } }, {raw: true}).then(
         function (result, err)
         {
            cb(err, result);
         });
   }
   else if (origin)
   {
      return Tasks.findAll({ where: { origin: origin } }, {raw: true}).then(
         function (result, err)
         {
            cb(err, result);
         });
   }
   return Tasks.findAll({ }, {raw: true}).then(
      function (result, err)
      {
         cb(err, result);
      });
};

// --------------------------------
// Check if dest is found in tasks
// --------------------------------

exports.checkTask = function(origin, dest, cb)
{
   if (dest === "all")
   {
      return Tasks.findAll({ where: { origin: origin } }, {raw: true}).then(
         function (result, err)
         {
            cb(err, result);
         });
   }
   return Tasks.findAll({ where: { origin: origin,
      dest: dest } }, {raw: true}).then(
      function (result, err)
      {
         cb(err, result);
      });
};

// --------------------
// Remove Channel Task
// --------------------

exports.removeTask = function(origin, dest, cb)
{
   console.log("removeTask()");
   if (dest === "all")
   {
      console.log("removeTask() - all");
      return Tasks.destroy({ where: { [Op.or]: [{ origin: origin },{ dest: origin }] } }).then(
         function (err, result)
         {
            cb(null, result);
         });
   }
   return Tasks.destroy({ where: { [Op.or]: [{ origin: origin,
      dest: dest },{ origin: dest,
      dest: origin }] } }).then(
      function (err, result)
      {
         cb(null, result);
      });
};

// ---------------
// Get Task Count
// ---------------

exports.getTasksCount = function(origin, cb)
{
   return Tasks.count({ where: {"origin": origin }}).then(c =>
   {
      cb("", c);
   });
};

// ------------------
// Get Servers Count
// ------------------

exports.getServersCount = function(cb)
{
   return Servers.count().then(c =>
   {
      cb("", c);
   });
};

// ---------
// Add Group
// ---------

//   server: Sequelize.STRING(32),
//   name: Sequelize.STRING(32),
//   channel: Sequelize.STRING(32),
//   active: {
//      type: Sequelize.BOOLEAN,
//      defaultValue: true
//   },
//   lang: {
//      type: Sequelize.STRING(8),
//      defaultValue: "en"
//   },
exports.remGroup = function(group,cb)
{
   if (group.channel)
   {
      return Groups.destroy({ where: { [Op.and]: [{ name: group.name }, {server: group.server}, {channel: group.channel}]}}).then((err,result)=> cb(err,result));
   }
   else if (group.lang)
   {
      return Groups.destroy({ where: { [Op.and]: [{ name: group.name }, {server: group.server}, {lang: group.lang}]}}).then((err,result)=> cb(err,result));
   }
   else if (group.name)
   {
      return Groups.destroy({ where: { [Op.and]: [{ name: group.name }, {server: group.server}]}}).then((err,result)=> cb(err,result));
   }
   return Groups.destroy({ where: { [Op.and]: [{server: group.server}]}}).then((err,result)=> cb(err,result));
};

exports.addGroup = function(group,cb)
{
   Groups.upsert({
      name: group.name,
      server: group.server,
      channel: group.channel,
      active: true,
      lang: group.lang
   }).then(() =>
   {
      logger("dev", "group added successfully.");
      cb(null);
   })
      .catch(err =>
      {
         cb(err);
      });
};

exports.getGroupsCount = function(data, cb)
{
   return Tasks.count({ where: {"server": data.server }}).then(c =>
   {
      cb(null, c);
   }).catch(err =>
   {
      cb(err);
   });
};

exports.getGroups = function(data, cb)
{
   return Groups.findAll({ where: { server: data.server},
      group: ["name"],
      attributes: ["name"]}, {raw: true}).then(
      function (result, err)
      {
         cb(err, result);
      });
};

exports.getGroup = function(data, cb)
{
   if (data.channel)
   {
      return Groups.findAll({ where: { [Op.and]: [{name: data.name},{server: data.server},{channel: data.channel}] }}, {raw: true}).then(
         function (result, err)
         {
            cb(err, result);
         });
   }
   else if (data.lang)
   {
      return Groups.findAll({ where: { [Op.and]: [{name: data.name},{server: data.server},{lang: data.lang}] }}, {raw: true}).then(
         function (result, err)
         {
            cb(err, result);
         });
   }
   else if (data.name)
   {
      return Groups.findAll({ where: { [Op.and]: [{name: data.name},{server: data.server}] }}, {raw: true}).then(
         function (result, err)
         {
            cb(err, result);
         });
   }
   return Groups.findAll({ where: { server: data.server}}, {raw: true}).then(
      function (result, err)
      {
         cb(err, result);
      });
};

exports.addTask = function(task)
{
   task.dest.forEach(dest =>
   {
      Tasks.upsert({
         origin: task.origin,
         dest: dest,
         reply: task.reply,
         server: task.server,
         active: true,
         LangTo: task.to,
         LangFrom: task.from
      }).then(() =>
      {
         logger("dev", "Task added successfully.");
      })
         .catch(err =>
         {
            logger("error", err);
         });
   });
};

// ------------
// Update stat
// ------------

exports.increaseServers = function(id)
{
   return Servers.increment("count", { where: { id: id }});
};

// --------------
// Get bot stats
// --------------

exports.getStats = function(callback)
{
   return db.query(`select * from (select sum(count) as "totalCount", ` +
  `count(id)-1 as "totalServers" from servers) as table1, ` +
  `(select count(id)-1 as "activeSrv" from servers where active = TRUE) as table2, ` +
  `(select lang as "botLang" from servers where id = 'bot') as table3, ` +
  `(select count(distinct origin) as "activeTasks" ` +
  `from tasks where active = TRUE) as table4, ` +
  `(select count(distinct origin) as "activeUserTasks" ` +
  `from tasks where active = TRUE and origin like '@%') as table5;`, { type: Sequelize.QueryTypes.SELECT})
      .then(
         result => callback(result),
         err => logger("error", err + "\nQuery: " + err.sql, "db")
      );
};

// ----------------
// Get server info
// ----------------

exports.getServerInfo = function(id, callback)
{
   return db.query(`select * from (select count as "count",` +
   `lang as "lang" from servers where id = ?) as table1,` +
   `(select count(distinct origin) as "activeTasks"` +
   `from tasks where server = ?) as table2,` +
   `(select count(distinct origin) as "activeUserTasks"` +
   `from tasks where origin like '@%' and server = ?) as table3, ` +
   `(select embedstyle as "embedstyle" from servers where id = ?) as table4, ` +
   `(select bot2botstyle as "bot2botstyle" from servers where id = ?) as table5;`, { replacements: [ id, id, id, id, id],
      type: db.QueryTypes.SELECT})
      .then(
         result => callback(result),
         err => this.updateColumns() //+ logger("error", err + "\nQuery: " + err.sql, "db")
      );
};

// ---------
// Close DB
// ---------

exports.close = function()
{
   return db.close();
};
