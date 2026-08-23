import { saveProduct } from "@/app/admin/products/actions";

export type ProductFormData = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  categoryId?: string | null;
  productType?: string;
  productionDaysMin?: number;
  productionDaysMax?: number;
  basePrice?: number;
  salePrice?: number | null;
  sizeChart?: string | null;
  careInstructions?: string | null;
  isFeatured?: boolean;
  status?: string;
  pkPrice?: number | null;
  pkSalePrice?: number | null;
  countries?: string[];
};

const SIZE_CHART = `<thead><tr><th>Size</th><th>Bust (in)</th><th>Waist (in)</th><th>Hips (in)</th></tr></thead>
<tbody>
<tr><td>XS</td><td>31–32</td><td>24–25</td><td>34–35</td></tr>
<tr><td>S</td><td>33–34</td><td>26–27</td><td>36–37</td></tr>
<tr><td>M</td><td>35–36</td><td>28–29</td><td>38–39</td></tr>
<tr><td>L</td><td>37–38</td><td>30–31</td><td>40–41</td></tr>
<tr><td>XL</td><td>39–41</td><td>32–34</td><td>42–44</td></tr>
</tbody>`;

const CARE = `Professional dry clean only. Store in the garment bag provided, away from direct sunlight. Steam lightly before wearing — never iron directly over embroidery.`;

export default function ProductForm({
  product,
  categories,
  countries,
  isNew,
}: {
  product?: ProductFormData;
  categories: { id: string; name: string }[];
  countries: { id: string; code: string; name: string; currency: string }[];
  isNew: boolean;
}) {
  const p = product ?? {};
  const usd = (minor?: number | null) => (minor != null ? (minor / 100).toString() : "");

  return (
    <form action={saveProduct} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {p.id && <input type="hidden" name="id" value={p.id} />}

      <div className="space-y-5 border border-line bg-white p-6">
        <div>
          <label className="label" htmlFor="name">Product name *</label>
          <input id="name" name="name" required defaultValue={p.name} className="input" placeholder="Luxe Velvet Lehenga" />
        </div>
        <div>
          <label className="label" htmlFor="slug">URL slug <span className="normal-case text-stone-400">(auto if blank)</span></label>
          <input id="slug" name="slug" defaultValue={p.slug} className="input" placeholder="luxe-velvet-lehenga" />
        </div>
        <div>
          <label className="label" htmlFor="description">Description *</label>
          <textarea id="description" name="description" required rows={5} defaultValue={p.description} className="input" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="basePrice">Price — USD ($) *</label>
            <input id="basePrice" name="basePrice" required defaultValue={usd(p.basePrice)} placeholder="850" className="input" inputMode="decimal" />
            <p className="mt-1 text-[10px] text-stone-400">Applies to USA &amp; Canada (USD)</p>
          </div>
          <div>
            <label className="label" htmlFor="salePrice">Sale price — USD ($)</label>
            <input id="salePrice" name="salePrice" defaultValue={usd(p.salePrice)} className="input" inputMode="decimal" />
          </div>
          <div>
            <label className="label" htmlFor="pkPrice">Price — Pakistan (₨)</label>
            <input id="pkPrice" name="pkPrice" defaultValue={usd(p.pkPrice)} placeholder="238000" className="input" inputMode="decimal" />
          </div>
          <div>
            <label className="label" htmlFor="pkSalePrice">Sale price — Pakistan (₨)</label>
            <input id="pkSalePrice" name="pkSalePrice" defaultValue={usd(p.pkSalePrice)} className="input" inputMode="decimal" />
          </div>
        </div>

        <details className="border border-line">
          <summary className="cursor-pointer px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]">
            Size chart (HTML table)
          </summary>
          <textarea name="sizeChart" rows={8} defaultValue={p.sizeChart ?? SIZE_CHART} className="input !border-0 !border-t" />
        </details>
        <details className="border border-line">
          <summary className="cursor-pointer px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]">
            Care instructions
          </summary>
          <textarea name="careInstructions" rows={4} defaultValue={p.careInstructions ?? CARE} className="input !border-0 !border-t" />
        </details>

        {isNew && (
          <div className="space-y-4 border border-gold/40 bg-sand/50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-deep">New product setup</p>
            <div className="flex items-center gap-2">
              <input id="generateVariants" name="generateVariants" type="checkbox" defaultChecked className="size-4 accent-black" />
              <label htmlFor="generateVariants" className="text-xs">
                Auto-generate variants for every <strong>Size</strong> value (XS–XL) with SKUs
              </label>
            </div>
            <div>
              <label className="label" htmlFor="initialStock">Initial stock per variant</label>
              <input id="initialStock" name="initialStock" defaultValue="8" className="input !w-32" inputMode="numeric" />
              <p className="mt-1 text-[10px] text-stone-400">Made-to-order tip: stock = concurrent capacity slots.</p>
            </div>
            <div>
              <label className="label" htmlFor="imageUrl">Main image URL</label>
              <input id="imageUrl" name="imageUrl" className="input" placeholder="/uploads/p-red-lehenga.jpg" />
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="space-y-5">
        <div className="border border-line bg-white p-5">
          <p className="label">Status</p>
          <select name="status" defaultValue={p.status ?? "DRAFT"} className="input">
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active (visible)</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <div className="mt-4 flex items-center gap-2">
            <input id="isFeatured" name="isFeatured" type="checkbox" defaultChecked={p.isFeatured} className="size-4 accent-black" />
            <label htmlFor="isFeatured" className="text-xs">Featured on homepage</label>
          </div>
          <button className="btn-primary mt-5 w-full">{isNew ? "Create product" : "Save changes"}</button>
        </div>

        <div className="border border-line bg-white p-5">
          <p className="label">Category</p>
          <select name="categoryId" defaultValue={p.categoryId ?? ""} className="input">
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="border border-line bg-white p-5">
          <p className="label">Product type</p>
          <select name="productType" defaultValue={p.productType ?? "MADE_TO_ORDER"} className="input">
            <option value="MADE_TO_ORDER">Made to Order (30–45 days)</option>
            <option value="READY_TO_WEAR">Ready to Wear</option>
          </select>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="pmin">Prod. days min</label>
              <input id="pmin" name="productionDaysMin" defaultValue={p.productionDaysMin ?? 30} className="input" inputMode="numeric" />
            </div>
            <div>
              <label className="label" htmlFor="pmax">Prod. days max</label>
              <input id="pmax" name="productionDaysMax" defaultValue={p.productionDaysMax ?? 45} className="input" inputMode="numeric" />
            </div>
          </div>
        </div>

        <div className="border border-line bg-white p-5">
          <p className="label">Available in countries</p>
          <div className="space-y-2">
            {countries.map((c, i) => (
              <label key={c.id} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  name="countries"
                  value={c.id}
                  defaultChecked={isNew ? i < 3 : (p.countries ?? []).includes(c.id)}
                  className="size-4 accent-black"
                />
                {c.name} ({c.currency})
              </label>
            ))}
          </div>
        </div>
      </aside>
    </form>
  );
}
