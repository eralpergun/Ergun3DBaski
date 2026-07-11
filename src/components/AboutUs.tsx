import { Printer, ShieldCheck, Heart, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export default function AboutUs() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-radial from-slate-900 to-slate-950 text-white p-8 md:p-12 shadow-2xl border border-slate-800">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="px-4 py-1.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold tracking-wider uppercase border border-slate-700">
            Hakkımızda
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Ergün 3D Baskı
          </h2>
          <p className="mt-2 text-slate-400 font-medium italic">
            "Siz Seçin, Biz Basalım!"
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6 text-slate-300 text-sm md:text-base leading-relaxed">
            <p>
              Firmamız, merkezi <span className="text-white font-semibold">Karabük</span> olan, 13 yaşında genç ve dinamik bir girişimci tarafından heyecanla yönetilen yenilikçi bir <span className="text-slate-300 underline decoration-slate-400 decoration-1 font-semibold">3D baskı</span> işletmesidir.
            </p>
            <p>
              Geleceğin teknolojisini bugünden üreterek, hayal ettiğiniz modelleri gerçeğe dönüştürüyoruz. Her bir siparişi büyük bir titizlik, özen ve merakla hazırlıyoruz.
            </p>
            <p className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
              ⚡ <span className="text-slate-300 font-semibold">Aktif Donanım:</span> Şu an bünyemizde tam kalibre edilmiş 1 adet profesyonel 3D yazıcı bulunmakta olup, baskılarımızda yüksek mukavemet ve pürüzsüz yüzey kalitesi sunan <span className="text-white underline decoration-slate-500 decoration-2 font-semibold">eSUN PLA+</span> filamentleri kullanılmaktadır.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 hover:border-slate-550 transition-colors duration-300">
              <div className="p-3 bg-slate-800 rounded-xl w-fit text-slate-300 mb-3">
                <Printer className="h-6 w-6" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">eSUN PLA+</h3>
              <p className="text-xs text-slate-400">En kaliteli endüstriyel standartta filamentler</p>
            </div>

            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 hover:border-slate-550 transition-colors duration-300">
              <div className="p-3 bg-slate-800 rounded-xl w-fit text-slate-300 mb-3">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">Karabük</h3>
              <p className="text-xs text-slate-400">Türkiye'nin her yerine hızlı kargo imkanı</p>
            </div>

            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 hover:border-slate-550 transition-colors duration-300">
              <div className="p-3 bg-slate-800 rounded-xl w-fit text-slate-300 mb-3">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">13 Yaşında</h3>
              <p className="text-xs text-slate-400">Genç girişimci ruhuyla profesyonel hizmet</p>
            </div>

            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 hover:border-slate-550 transition-colors duration-300">
              <div className="p-3 bg-slate-800 rounded-xl w-fit text-slate-300 mb-3">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">Güvenli EFT</h3>
              <p className="text-xs text-slate-400">Havale/EFT sonrası anında baskı onayı</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
