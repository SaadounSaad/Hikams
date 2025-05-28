// components/VoiceSearchSettings.tsx - Panneau de configuration avancé
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Mic, 
  BarChart3, 
  Brain, 
  Volume2, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Globe,
  Zap
} from 'lucide-react';
import { 
  ARABIC_DIALECTS, 
  DialectSelector, 
  VoiceSearchAnalytics, 
  VoiceSearchLearner 
} from '../utils/voiceSearchEnhanced';

interface VoiceSearchSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: {
    dialect: keyof typeof ARABIC_DIALECTS;
    sensitivity: 'low' | 'medium' | 'high';
    autoCorrection: boolean;
    contextualLearning: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

export const VoiceSearchSettings: React.FC<VoiceSearchSettingsProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsChange
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'analytics' | 'learning'>('general');
  const [analytics] = useState(() => new VoiceSearchAnalytics());
  const [learner] = useState(() => new VoiceSearchLearner());
  const [testingMic, setTestingMic] = useState(false);
  const [micTestResult, setMicTestResult] = useState<'idle' | 'success' | 'error'>('idle');

  // Test du microphone
  const testMicrophone = async () => {
    setTestingMic(true);
    setMicTestResult('idle');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Créer un analyseur audio pour détecter le son
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Vérifier l'activité audio pendant 3 secondes
      let hasAudio = false;
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        if (average > 10) { // Seuil d'activité audio
          hasAudio = true;
        }
      };
      
      const interval = setInterval(checkAudio, 100);
      
      setTimeout(() => {
        clearInterval(interval);
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        
        setMicTestResult(hasAudio ? 'success' : 'error');
        setTestingMic(false);
      }, 3000);
      
    } catch (error) {
      console.error('Erreur test microphone:', error);
      setMicTestResult('error');
      setTestingMic(false);
    }
  };

  const stats = analytics.getStats();
  const recommendations = analytics.getRecommendations();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mic className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">إعدادات البحث الصوتي</h2>
              <p className="text-sm text-gray-500">تخصيص وتحسين تجربة البحث الصوتي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'general', label: 'عام', icon: Settings },
            { id: 'analytics', label: 'إحصائيات', icon: BarChart3 },
            { id: 'learning', label: 'تعلم ذكي', icon: Brain }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-arabic">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Onglet Général */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Sélection du dialecte */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 font-arabic">
                  اللهجة المفضلة
                </label>
                <DialectSelector
                  selectedDialect={currentSettings.dialect}
                  onDialectChange={(dialect) => 
                    onSettingsChange({ ...currentSettings, dialect })
                  }
                />
                <p className="text-xs text-gray-500 font-arabic">
                  اختر اللهجة التي تتحدث بها عادة لتحسين دقة التعرف
                </p>
              </div>

              {/* Sensibilité */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 font-arabic">
                  حساسية التعرف
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'low', label: 'منخفضة', desc: 'أقل حساسية، أكثر دقة' },
                    { value: 'medium', label: 'متوسطة', desc: 'توازن بين السرعة والدقة' },
                    { value: 'high', label: 'عالية', desc: 'أكثر حساسية، أسرع استجابة' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => onSettingsChange({ 
                        ...currentSettings, 
                        sensitivity: option.value as any 
                      })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        currentSettings.sensitivity === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-medium font-arabic">{option.label}</div>
                      <div className="text-xs text-gray-500 font-arabic mt-1">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options avancées */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 font-arabic">خيارات متقدمة</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-700 font-arabic">التصحيح التلقائي</div>
                      <div className="text-xs text-gray-500 font-arabic">تصحيح الأخطاء الشائعة تلقائياً</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentSettings.autoCorrection}
                      onChange={(e) => onSettingsChange({
                        ...currentSettings,
                        autoCorrection: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-700 font-arabic">التعلم السياقي</div>
                      <div className="text-xs text-gray-500 font-arabic">تحسين النتائج بناء على استخدامك</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentSettings.contextualLearning}
                      onChange={(e) => onSettingsChange({
                        ...currentSettings,
                        contextualLearning: e.target.checked
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              {/* Test du microphone */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 font-arabic">اختبار الميكروفون</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={testMicrophone}
                    disabled={testingMic}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {testingMic ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="font-arabic">جاري الاختبار...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span className="font-arabic">اختبر الميكروفون</span>
                      </>
                    )}
                  </button>

                  {micTestResult === 'success' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-arabic">يعمل بشكل جيد</span>
                    </div>
                  )}

                  {micTestResult === 'error' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-arabic">مشكلة في الميكروفون</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Onglet Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Statistiques générales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalSearches}</div>
                  <div className="text-sm text-blue-700 font-arabic">إجمالي البحثات</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(stats.successRate * 100)}%
                  </div>
                  <div className="text-sm text-green-700 font-arabic">معدل النجاح</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(stats.averageConfidence * 100)}%
                  </div>
                  <div className="text-sm text-purple-700 font-arabic">متوسط الثقة</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.mostUsedTerms.length}</div>
                  <div className="text-sm text-orange-700 font-arabic">كلمات مختلفة</div>
                </div>
              </div>

              {/* Termes les plus utilisés */}
              {stats.mostUsedTerms.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 font-arabic mb-3">الكلمات الأكثر استخداماً</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {stats.mostUsedTerms.slice(0, 9).map((term, index) => (
                      <div key={term.term} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm font-arabic">{term.term}</span>
                        <span className="text-xs text-gray-500">{term.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommandations */}
              {recommendations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 font-arabic mb-3">توصيات للتحسين</h3>
                  <div className="space-y-2">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-yellow-800 font-arabic">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Onglet Apprentissage */}
          {activeTab === 'learning' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <Brain className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 font-arabic mb-2">
                  التعلم الذكي
                </h3>
                <p className="text-gray-600 font-arabic">
                  يتعلم النظام من تصحيحاتك لتحسين دقة البحث الصوتي
                </p>
              </div>

              {/* Corrections personnalisées */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 font-arabic mb-3">
                  التصحيحات الشخصية
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-xs font-medium text-gray-500 mb-2">
                    <div className="font-arabic">ما سُمع</div>
                    <div className="font-arabic">ما قُصد</div>
                  </div>
                  
                  {/* Exemples de corrections (simulation) */}
                  {[
                    { heard: 'الا', corrected: 'إلا' },
                    { heard: 'انشاء الله', corrected: 'إن شاء الله' },
                    { heard: 'قران', corrected: 'قرآن' }
                  ].map((correction, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 py-2 border-b border-gray-200 last:border-0">
                      <div className="text-sm text-gray-600 font-arabic">{correction.heard}</div>
                      <div className="text-sm text-gray-900 font-arabic">{correction.corrected}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amélioration continue */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 font-arabic mb-1">
                      تحسين مستمر
                    </h4>
                    <p className="text-sm text-gray-600 font-arabic mb-3">
                      كلما استخدمت البحث الصوتي أكثر، كلما أصبح أكثر دقة وفهماً لطريقة كلامك
                    </p>
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-arabic">النظام يتعلم في الخلفية</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Options d'apprentissage */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 font-arabic mb-3">
                  خيارات التعلم
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-700 font-arabic">حفظ التصحيحات</div>
                      <div className="text-xs text-gray-500 font-arabic">احتفظ بتصحيحاتي لتحسين النتائج</div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-700 font-arabic">التعلم من السياق</div>
                      <div className="text-xs text-gray-500 font-arabic">استخدم سياق البحث لتحسين الفهم</div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-700 font-arabic">مشاركة التحسينات</div>
                      <div className="text-xs text-gray-500 font-arabic">ساعد في تحسين النظام للجميع (مجهول)</div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={false}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              {/* Réinitialisation */}
              <div className="pt-4 border-t border-gray-200">
                <button className="text-sm text-red-600 hover:text-red-700 font-arabic">
                  إعادة تعيين بيانات التعلم
                </button>
                <p className="text-xs text-gray-500 font-arabic mt-1">
                  سيؤدي هذا إلى حذف جميع التصحيحات والتحسينات المحفوظة
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 font-arabic">
            💡 نصيحة: تحدث بوضوح في مكان هادئ للحصول على أفضل النتائج
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-arabic transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-arabic transition-colors"
            >
              حفظ التغييرات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};