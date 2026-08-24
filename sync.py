"""一键同步：拉取最新任务清单 → 生成信息流(feed.html) + 今日合集 → 推 GitHub Pages。
用法：python3 sync.py [--no-push]
前置：需 git 已配置且 remote origin 指向 GitHub 仓库（已配置则直接跑）。
"""
import subprocess, sys, shutil
from pathlib import Path
from datetime import date

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))

def run(cmd, check=True):
    print(">>", " ".join(cmd))
    r = subprocess.run(cmd, cwd=ROOT)
    if check and r.returncode != 0:
        raise SystemExit(f"命令失败: {' '.join(cmd)}")

def main():
    no_push = "--no-push" in sys.argv
    # 1) 拉取最新任务清单（若 task_schedule 可用）
    try:
        import load_tasks; load_tasks.main()
    except Exception as e:
        print("[sync] load_tasks 跳过:", e)
    # 2) 生成信息流 + 今日合集
    import build_feed; build_feed.build()
    import archive_today; archive_today.main()
    if no_push:
        print("[sync] --no-push 已指定，跳过推送。"); return
    # 3) 推送 GitHub Pages
    today = date.today().isoformat()
    run(["git","add","."])
    run(["git","commit","-m",f"sync: 更新信息流 {today}"], check=False)
    run(["git","push","origin","main"])
    print("[sync] 已推送到 GitHub Pages，稍后访问站点即可看到更新。")

if __name__ == "__main__":
    main()
