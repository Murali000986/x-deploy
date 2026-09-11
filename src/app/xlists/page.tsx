"use client";
import { useState, useEffect, useCallback } from "react";
import { Loader2, Search, ExternalLink, Copy, Check, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

const STATUSES = ["all", "new", "pending", "chat", "done"];
const STATUS_COLORS: Record<string, string> = {
  new:     "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  chat:    "bg-green-100 text-green-700",
  done:    "bg-zinc-100 text-zinc-500",
};

interface XListItem {
  _id: string;
  username: string;
  xUrl: string;
  walletAddress?: string;
  usdValue?: string;
  category?: string;
  status: string;
  addedAt: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="ml-1.5 text-zinc-400 hover:text-zinc-600 cursor-pointer inline-flex items-center shrink-0" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function XListPage() {
  const [items, setItems] = useState<XListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortValue, setSortValue] = useState<"" | "value_asc" | "value_desc">("");
  const [loading, setLoading] = useState(true);
  const limit = 50;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status !== "all") params.set("status", status);
    if (search) params.set("search", search);
    if (sortValue) params.set("sort", sortValue);
    const res = await fetch(`/api/xlists?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, status, search, sortValue]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch(`/api/xlists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchItems();
  };

  const toggleSort = () => {
    setSortValue(prev => prev === "value_desc" ? "value_asc" : "value_desc");
    setPage(1);
  };

  const SortIcon = sortValue === "value_desc" ? ArrowDown : sortValue === "value_asc" ? ArrowUp : ArrowUpDown;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">X Lists</h1>
        <p className="text-zinc-500 text-sm mt-1">{total.toLocaleString()} accounts imported</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            className="outline-none text-sm flex-1 bg-transparent"
            placeholder="Search username..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} className="text-zinc-400 hover:text-zinc-600 text-xs cursor-pointer">✕</button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-colors cursor-pointer ${status === s ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Sort by value */}
        <button onClick={toggleSort}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${sortValue ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
          <SortIcon className="w-3.5 h-3.5" />
          Sort by Value {sortValue === "value_desc" ? "(High→Low)" : sortValue === "value_asc" ? "(Low→High)" : ""}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-zinc-400" /></div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50 text-zinc-500 text-xs">
                    <th className="text-left px-4 py-3 font-medium">#</th>
                    <th className="text-left px-4 py-3 font-medium">Username</th>
                    <th className="text-left px-4 py-3 font-medium">Category</th>
                    <th className="text-left px-4 py-3 font-medium">Wallet Address</th>
                    <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={toggleSort}>
                      <span className="flex items-center gap-1">
                        USD Value <SortIcon className="w-3 h-3" />
                      </span>
                    </th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">X</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-16 text-zinc-400">No records found</td></tr>
                  )}
                  {items.map((item, i) => (
                    <tr key={item._id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 text-zinc-400 text-xs">{(page - 1) * limit + i + 1}</td>
                      <td className="px-4 py-3 font-medium">@{item.username}</td>
                      <td className="px-4 py-3 text-zinc-500 capitalize">{item.category || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                        {item.walletAddress ? (
                          <span className="flex items-center gap-0.5">
                            <span className="break-all">{item.walletAddress}</span>
                            <CopyButton text={item.walletAddress} />
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                        {item.usdValue && item.usdValue !== "No Data" ? (
                          <span className="flex items-center gap-0.5">
                            {item.usdValue}
                            <CopyButton text={item.usdValue} />
                          </span>
                        ) : <span className="text-zinc-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <select value={item.status} onChange={e => handleStatusChange(item._id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-lg font-medium border-0 cursor-pointer ${STATUS_COLORS[item.status]} outline-none`}>
                          {["new","pending","chat","done"].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <a href={item.xUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-zinc-500">
              <span>Page {page} of {totalPages} ({total.toLocaleString()} total)</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 cursor-pointer">← Prev</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 cursor-pointer">Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
