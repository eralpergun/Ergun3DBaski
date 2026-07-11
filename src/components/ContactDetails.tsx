import { Mail, Phone, MapPin, Instagram } from 'lucide-react';

export default function ContactDetails() {
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl">
      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-slate-900"></span>
        İletişim Bilgileri
      </h3>

      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-slate-100 rounded-2xl text-slate-800 shrink-0">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Telefon / WhatsApp</h4>
            <p className="text-slate-800 font-medium mt-0.5">+90 530 000 0000</p>
            <p className="text-xs text-slate-400">Hafta içi & hafta sonu: 09:00 - 21:00</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-slate-100 rounded-2xl text-slate-800 shrink-0">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">E-posta</h4>
            <p className="text-slate-800 font-medium mt-0.5">ergun3dbaski@gmail.com</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-slate-100 rounded-2xl text-slate-800 shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Merkez Adres</h4>
            <p className="text-slate-800 font-medium mt-0.5">Merkez / Karabük</p>
            <p className="text-xs text-slate-400">Türkiye geneli anlaşmalı kargo gönderimi yapılmaktadır.</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-slate-100 rounded-2xl text-slate-800 shrink-0">
            <Instagram className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sosyal Medya</h4>
            <a 
              href="https://instagram.com/3deralp" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-slate-800 font-medium hover:underline mt-0.5 inline-block"
            >
              @3deralp
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
        <p className="text-xs text-slate-500 leading-relaxed text-center">
          💡 <span className="font-semibold text-slate-700">Tasarım Destek:</span> Model seçiminde kararsız kaldıysanız veya özel boyutlarda üretim istiyorsanız bizimle iletişime geçebilirsiniz.
        </p>
      </div>
    </div>
  );
}
