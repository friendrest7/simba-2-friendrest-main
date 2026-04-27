import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { type BranchName } from "@/lib/demo-store";
import { addBranchReview, getBranchReviewSummary, getBranchReviews } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function BranchReviews({ branch }: { branch: BranchName }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [reviews, setReviews] = useState<Awaited<ReturnType<typeof getBranchReviews>>>([]);
  const [summary, setSummary] = useState({ count: 0, average: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    void (async () => {
      const [nextReviews, nextSummary] = await Promise.all([
        getBranchReviews(branch),
        getBranchReviewSummary(branch),
      ]);

      if (!active) return;
      setReviews(nextReviews);
      setSummary(nextSummary);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [branch]);

  const submitReview = async () => {
    const result = await addBranchReview({
      branch,
      authorName: user?.name || "Guest",
      authorUserId: user?.id,
      rating,
      title,
      comment,
    });

    if (!result.ok) {
      toast.error(t(result.error));
      return;
    }

    setTitle("");
    setComment("");
    setRating(5);
    const [nextReviews, nextSummary] = await Promise.all([
      getBranchReviews(branch),
      getBranchReviewSummary(branch),
    ]);
    setReviews(nextReviews);
    setSummary(nextSummary);
    toast.success(t("reviews.submit"));
  };

  return (
    <section className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{branch}</div>
          <h2 className="mt-1 text-2xl font-black tracking-tight">{t("reviews.title")}</h2>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Stars rating={summary.average} />
            <span>{summary.average > 0 ? summary.average.toFixed(1) : "0.0"} / 5</span>
            <span>({summary.count})</span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_0.92fr]">
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              {t("reviews.empty")}
            </div>
          ) : (
            reviews.slice(0, 4).map((review) => (
              <div key={review.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">{review.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{review.authorName}</div>
                  </div>
                  <Stars rating={review.rating} />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{review.comment}</p>
              </div>
            ))
          )}
        </div>

        <div className="rounded-2xl border border-border bg-background p-4">
          <h3 className="text-lg font-bold">{t("reviews.add")}</h3>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="review-rating">{t("reviews.rating")}</Label>
              <select
                id="review-rating"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="review-title">{t("reviews.reviewTitle")}</Label>
              <Input
                id="review-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 h-11 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="review-comment">{t("reviews.comment")}</Label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1.5 min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none"
              />
            </div>
            <Button
              type="button"
              onClick={submitReview}
              className="w-full rounded-full gradient-brand text-brand-foreground hover:opacity-90"
            >
              {t("reviews.submit")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-1 text-brand-yellow">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={`h-4 w-4 ${index < full ? "fill-current" : ""}`} />
      ))}
    </div>
  );
}
