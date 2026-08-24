#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
投研播客 · 每日合集归档脚本
用法：python archive_today.py [YYYY-MM-DD]
功能：为指定日期（默认今天）生成一期"每日合集"页面 daily/YYYY-MM-DD.html，
      并在 data/daily_index.json 中登记，便于后续在首页聚合入口。
      合集正文由各任务当天产出文字手动/自动填入 episodes.json 对应 body 字段后，
      运行本脚本即可渲染成可收听的独立合集页。
"""
import json, os, sys
from datetime import date

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data")
os.makedirs(os.path.join(ROOT, "daily"), exist_ok=True)

def load_ep():
    with open(os.path.join(DATA, "episodes.json"), encoding="utf-8") as f:
        return json.load(f)

def today_str():
    return sys.argv[1] if len(sys.argv) > 1 else date.today().strftime("%Y-%m-%d")

def build_page(ep_data, day):
    items = []
    ph = '<p class="ph">（本期该任务当日产出尚未填入 body 字段）</p>'
    for e in ep_data["episodes"]:
        body = e.get("body") or ""
        content = body if body else ph
        items.append(
            '<article class="epi">'
            '<h3>' + e["title"] + '</h3>'
            '<div class="meta">' + e["schedule"] + ' · ' + e.get("task_title","") + '</div>'
            '<div class="content">' + content + '</div>'
            '</article>'
        )
    items_html = "".join(items)
    html = ('<!DOCTYPE html>\n'
'<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n'
'<title>每日合集 ' + day + ' · 投研播客</title>\n'
'<link rel="stylesheet" href="../styles.css">\n'
'<style>.daily{max-width:860px;margin:0 auto;padding:24px 28px 40px;}.epi{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:18px;margin:16px 0;}.epi h3{font-size:17px;} .epi .meta{font-size:12px;color:var(--muted);margin:6px 0 10px;}.epi .content{font-size:14px;color:#d3d7df;white-space:pre-wrap;}.epi .ph{color:var(--muted);font-style:italic;}</style>\n'
'</head><body>\n'
'<header class="site-header"><div class="brand"><div class="logo">投</div><div><h1>投研播客</h1><p class="sub">元宝投研 · 每日开车听点硬核的</p></div></div></header>\n'
'<section class="daily">\n'
'  <a class="back" href="../index.html" style="color:var(--muted);font-size:13px;">&larr; 返回节目单</a>\n'
'  <h2 style="font-size:24px;margin:10px 0;">&#128197; 每日合集 · ' + day + '</h2>\n'
'  <p style="color:var(--muted);font-size:13px;">本页聚合当天各投研任务的产出正文，可逐期点开收听（浏览器 TTS）。</p>\n'
  + items_html + '\n'
'<footer class="site-footer"><p>投研播客 · 内容由元宝定时任务产出，仅供研究参考，不构成投资建议。</p></footer>\n'
'</body></html>')
    return html

def main():
    day = today_str()
    ep = load_ep()
    page = build_page(ep, day)
    out = os.path.join(ROOT, "daily", f"{day}.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(page)
    idx_path = os.path.join(DATA, "daily_index.json")
    idx = []
    if os.path.exists(idx_path):
        try: idx = json.load(open(idx_path, encoding="utf-8"))
        except: idx = []
    if not any(d.get("date") == day for d in idx):
        idx.append({"date": day, "file": f"daily/{day}.html"})
        idx.sort(key=lambda x: x["date"], reverse=True)
        with open(idx_path, "w", encoding="utf-8") as f:
            json.dump(idx, f, ensure_ascii=False, indent=2)
    print(f"[OK] 每日合集已生成：{out}")

if __name__ == "__main__":
    main()
