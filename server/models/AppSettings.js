const mongoose = require('mongoose');

/**
 * Singleton collection for cross-client global settings.
 * INR-only platform — no USD markup is applied anywhere.
 */
const appSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },
}, { timestamps: true });

appSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne({ key: 'global' });
  if (!doc) doc = await this.create({ key: 'global' });
  return doc;
};

module.exports = mongoose.model('AppSettings', appSettingsSchema);
