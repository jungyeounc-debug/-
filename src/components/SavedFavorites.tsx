import React from 'react';
import { Bookmark, Heart, Trash2, Share2, Compass, Calendar } from 'lucide-react';
import { DateCourse, SavedItem } from '../types';

interface SavedFavoritesProps {
  savedItems: SavedItem[];
  onRemoveItem: (id: string) => void;
  onOpenGoogleChat: (message: string, title: string) => void;
  onViewCourseDetail?: (course: DateCourse) => void;
}

export const SavedFavorites: React.FC<SavedFavoritesProps> = ({
  savedItems,
  onRemoveItem,
  onOpenGoogleChat,
  onViewCourseDetail,
}) => {
  const courseItems = savedItems.filter((i) => i.type === 'course');
  const quoteItems = savedItems.filter((i) => i.type === 'quote');

  const handleShareCourse = (course: DateCourse) => {
    let text = `[SoloMate 보관된 데이트 코스]\n`;
    text += `💖 ${course.title}\n`;
    text += `📍 지역: ${course.region} | ⏱️ 소요시간: ${course.totalDuration} | 💰 예상비용: ${course.totalEstimatedCost}\n\n`;
    text += `📖 코스 요약:\n${course.summary}\n\n`;
    text += `🗺️ 코스 일정:\n`;
    course.stops?.forEach((s) => {
      text += `[${s.step}단계] ${s.name} (${s.time}, ${s.estimatedCost})\n- 추천: ${s.recommendedItem}\n- 팁: ${s.soloOrCoupleTip}\n\n`;
    });
    onOpenGoogleChat(text.trim(), course.title);
  };

  const handleShareQuote = (item: SavedItem) => {
    const text = `[SoloMate 마음을 울린 위로글]\n\n"${item.content}"\n\n- ${item.date} 저장됨`;
    onOpenGoogleChat(text, item.title);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-200 gap-3">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>나만의 보관함</span>
          </h2>
          <p className="text-xs text-neutral-500">
            저장해둔 감성 위로글과 데이트 코스를 언제든 다시 확인하고 Google Chat으로 공유하세요.
          </p>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full self-start sm:self-auto">
          총 {savedItems.length}개 보관
        </span>
      </div>

      {savedItems.length === 0 ? (
        <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-800">보관함이 비어있습니다</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            감성 상담소에서 마음에 드는 위로 문장을 저장하거나, 실시간 데이트 코스에서 추천받은 일정을 북마크하면 브라우저에 안전하게 보관됩니다.
          </p>
        </div>
      ) : (
        <>
          {/* Saved Date Courses Section */}
          {courseItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-rose-500" />
                <span>저장한 데이트 코스 ({courseItems.length})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courseItems.map((item) => {
                  const c = item.courseData;
                  if (!c) return null;
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-2xs hover:border-rose-300 transition space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                            {c.mode === 'solo' ? '솔로 힐링 투어' : '로맨틱 데이트'}
                          </span>
                          <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {item.date}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-sm sm:text-base text-neutral-900">
                          {c.title}
                        </h4>
                        <p className="text-xs text-neutral-500 line-clamp-2">
                          {c.subtitle || c.summary}
                        </p>

                        <div className="text-[11px] text-neutral-600 flex flex-wrap items-center gap-3 pt-1">
                          <span>📍 {c.region}</span>
                          <span>⏱️ {c.totalDuration}</span>
                          <span className="font-semibold text-rose-600">💰 {c.totalEstimatedCost}</span>
                        </div>

                        {/* Simple list of stops */}
                        <div className="bg-neutral-50 rounded-xl p-2.5 space-y-1">
                          {c.stops?.slice(0, 3).map((st: any, i: number) => (
                            <div key={i} className="text-[11px] text-neutral-600 flex items-center justify-between">
                              <span>
                                {st.step}. {st.name}
                              </span>
                              <span className="text-neutral-400 text-[10px]">{st.category}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-neutral-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-neutral-100 transition"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2">
                          {onViewCourseDetail && (
                            <button
                              onClick={() => onViewCourseDetail(c)}
                              className="px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg transition"
                            >
                              상세보기
                            </button>
                          )}
                          <button
                            onClick={() => handleShareCourse(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Google Chat 공유</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Saved Comfort Quotes Section */}
          {quoteItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>저장한 토닥토닥 위로글 ({quoteItems.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {quoteItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-amber-700 font-bold">
                        <span>💌 {item.title}</span>
                        <span className="text-[10px] text-neutral-400 font-normal">{item.date}</span>
                      </div>
                      <p className="text-xs text-neutral-700 italic leading-relaxed">
                        "{item.content}"
                      </p>
                    </div>

                    <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-neutral-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white/60 transition"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleShareQuote(item)}
                        className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Google Chat 전송</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
