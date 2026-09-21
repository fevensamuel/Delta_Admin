import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  getContactSettingsApi,
  updateContactSettingsApi,
  ContactSettings as ContactSettingsType,
} from '../../api/contactSettings';
import { Save, Loader2, Phone, MessageSquare, Send, Power } from 'lucide-react';

export const ContactSettings: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ContactSettingsType>({
    id: 1,
    whatsappNumber: '',
    phoneNumber: '',
    smsNumber: '',
    isActive: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getContactSettingsApi();
      setSettings(data);
    } catch (error) {
      showToast('error', 'Failed to load contact settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateContactSettingsApi({
        whatsappNumber: settings.whatsappNumber,
        phoneNumber: settings.phoneNumber,
        smsNumber: settings.smsNumber,
        isActive: settings.isActive,
      });
      setSettings(updated);
      showToast('success', 'Contact settings updated successfully');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    const newValue = !settings.isActive;
    setSettings((s) => ({ ...s, isActive: newValue }));
    try {
      await updateContactSettingsApi({ isActive: newValue });
      showToast('success', `Contact widgets ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      showToast('error', 'Failed to update status');
      setSettings((s) => ({ ...s, isActive: !newValue }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#C8102E]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Contact Settings</h2>
          <p className="text-sm text-[#718096]">
            Manage the WhatsApp, Phone, and SMS numbers shown on the website
          </p>
        </div>
        <button
          onClick={toggleActive}
          className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors ${
            settings.isActive
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
          }`}
        >
          <Power className="w-4 h-4" />
          {settings.isActive ? 'Active' : 'Inactive'}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 space-y-5">
        {/* WhatsApp */}
        <div>
          <label className="text-xs font-bold text-[#111827] mb-1.5 flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-[#25D366]" />
            WhatsApp Number
          </label>
          <input
            type="text"
            value={settings.whatsappNumber}
            onChange={(e) =>
              setSettings((s) => ({ ...s, whatsappNumber: e.target.value }))
            }
            placeholder="+251910136747"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
          />
          <p className="text-[11px] text-[#718096] mt-1">
            Include country code. Spaces and + are fine.
          </p>
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-bold text-[#111827] mb-1.5 flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-[#C8102E]" />
            Phone Number (Call)
          </label>
          <input
            type="text"
            value={settings.phoneNumber}
            onChange={(e) =>
              setSettings((s) => ({ ...s, phoneNumber: e.target.value }))
            }
            placeholder="+251910136747"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
          />
        </div>

        {/* SMS */}
        <div>
          <label className="text-xs font-bold text-[#111827] mb-1.5 flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-[#C8102E]" />
            SMS Number
          </label>
          <input
            type="text"
            value={settings.smsNumber}
            onChange={(e) =>
              setSettings((s) => ({ ...s, smsNumber: e.target.value }))
            }
            placeholder="+251910136747"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E]"
          />
        </div>

        <div className="pt-3 border-t border-[#E2E8F0]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#C8102E] hover:bg-[#A00D24] text-white font-bold text-sm rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <p className="font-bold">💡 Tip:</p>
        <p>
          These numbers appear in the floating widget (WhatsApp, Call, SMS
          buttons) and on the home page. Changes take effect immediately on the
          public website.
        </p>
      </div>
    </div>
  );
};