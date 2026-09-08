'use client';
import { useState, type ReactNode } from 'react';
import {
  Users,
  Package,
  Wallet,
  Plus,
  Search,
  Pencil,
  Trash2,
  ArrowRight,
  ChevronLeft,
  Phone,
  Layers,
  Check,
  Building2,
  ReceiptText,
  ArrowDownLeft,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  money,
  total,
  balance,
  validLedger,
  normalize,
  phoneNumber,
  type Transaction,
} from '@/lib/ledger';
type Customer = { id: string; name: string; phone: string; notes: string };
type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  buy: number;
  sell: number;
  quantity: number;
  alert: number;
  category: string;
};
type FormState = {
  kind: 'customer' | 'category' | 'product';
  id?: string;
  name: string;
  phone?: string;
  notes?: string;
  buy?: string;
  sell?: string;
  quantity?: string;
  alert?: string;
  category?: string;
};
const uid = () => crypto.randomUUID();
function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label>
      {label}
      <input
        required
        inputMode="numeric"
        dir="ltr"
        value={value ? money(Number(value)) : ''}
        onChange={(e) => {
          const v = normalize(e.target.value).replace(/[,٬\s]/g, '');
          if (/^\d{0,12}$/.test(v)) onChange(v);
        }}
        placeholder="0"
      />
    </label>
  );
}
function IconButton({
  label,
  onClick,
  children,
  kind = '',
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  kind?: string;
}) {
  return (
    <button
      type="button"
      className={'icon-btn ' + kind}
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
function WhatsApp() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20.5 11.6a8.5 8.5 0 0 1-12.8 7.3L3 20.3l1.4-4.5a8.5 8.5 0 1 1 16.1-4.2Z" />
      <path d="M8.3 7.4c-.8.7-.5 2.3.7 4 1.4 2 3.8 3.7 5.5 3.1.7-.2 1.3-1.1 1.2-1.7l-2.2-1-1 1c-1.5-.7-2.5-1.8-3-3l.8-.9-.9-1.5Z" />
    </svg>
  );
}
export default function Home() {
  const [tab, setTab] = useState('customers'),
    [customers, setCustomers] = useState<Customer[]>([]),
    [categories, setCategories] = useState<Category[]>([]),
    [products, setProducts] = useState<Product[]>([]),
    [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState(''),
    [selected, setSelected] = useState<string | null>(null),
    [category, setCategory] = useState('all'),
    [manage, setManage] = useState(false),
    [form, setForm] = useState<FormState | null>(null),
    [notice, setNotice] = useState(''),
    [error, setError] = useState('');
  const [confirm, setConfirm] = useState<{
      text: string;
      action: () => void;
    } | null>(null),
    [editor, setEditor] = useState<{
      type: 'debt' | 'payment';
      id?: string;
      items: { name: string; price: string }[];
      amount: string;
    } | null>(null);
  const customer = customers.find((c) => c.id === selected),
    ledger = transactions.filter((t) => t.customer === selected),
    debt = balance(ledger),
    filtered = customers.filter((c) =>
      normalize(c.name).startsWith(normalize(search.trim())),
    );
  const notify = (s: string) => {
      setNotice(s);
      setError('');
    },
    openForm = (f: FormState) => {
      setError('');
      setForm(f);
    };
  function changeTab(v: unknown) {
    setTab(String(v));
    setSearch('');
    setSelected(null);
    setEditor(null);
    setManage(false);
    setError('');
  }
  function saveForm(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form) return;
    const name = form.name.trim(),
      id = form.id || uid();
    if (!name) {
      setError('اكتب الاسم أولًا');
      return;
    }
    if (form.kind === 'customer') {
      if (!phoneNumber(form.phone || '')) {
        setError('اكتب رقم واتساب صحيحًا، مثل 07xxxxxxxxx');
        return;
      }
      const c = {
        id,
        name,
        phone: form.phone || '',
        notes: form.notes?.trim() || '',
      };
      setCustomers((old) =>
        form.id ? old.map((x) => (x.id === id ? c : x)) : [...old, c],
      );
    }
    if (form.kind === 'category') {
      if (
        categories.some(
          (c) => c.id !== id && normalize(c.name) === normalize(name),
        )
      ) {
        setError('هذا التصنيف موجود بالفعل');
        return;
      }
      const c = { id, name };
      setCategories((old) =>
        form.id ? old.map((x) => (x.id === id ? c : x)) : [...old, c],
      );
    }
    if (form.kind === 'product') {
      if (!form.category) {
        setError('اختر التصنيف أولًا');
        return;
      }
      const p = {
        id,
        name,
        buy: Number(form.buy),
        sell: Number(form.sell),
        quantity: Number(form.quantity),
        alert: Number(form.alert),
        category: form.category,
      };
      if (
        [p.buy, p.sell, p.quantity, p.alert].some(
          (n) => !Number.isSafeInteger(n) || n < 0,
        )
      ) {
        setError('أدخل أعدادًا صحيحة موجبة أو صفرًا');
        return;
      }
      setProducts((old) =>
        form.id ? old.map((x) => (x.id === id ? p : x)) : [...old, p],
      );
    }
    setForm(null);
    notify('تم الحفظ بنجاح');
  }
  function deleteCustomer(c: Customer) {
    if (transactions.some((t) => t.customer === c.id)) {
      notify(
        'لا يمكن حذف زبون لديه معاملات. احذف معاملاته أولًا للحفاظ على الحسابات.',
      );
      return;
    }
    setConfirm({
      text: `حذف الزبون «${c.name}»؟`,
      action: () => {
        setCustomers((old) => old.filter((x) => x.id !== c.id));
        notify('تم حذف الزبون');
      },
    });
  }
  function startTransaction(type: 'debt' | 'payment', t?: Transaction) {
    setError('');
    setEditor({
      type,
      id: t?.id,
      items: t?.items.map((i) => ({
        name: i.name,
        price: String(i.price),
      })) || [{ name: '', price: '' }],
      amount: t ? String(t.amount) : '',
    });
  }
  function saveTransaction(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editor || !selected) return;
    const items =
        editor.type === 'debt'
          ? editor.items.map((i) => ({
              name: i.name.trim(),
              price: Number(i.price),
            }))
          : [],
      amount = editor.type === 'debt' ? total(items) : Number(editor.amount);
    if (
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      items.some((i) => !i.name || i.price <= 0)
    ) {
      setError('اكتب وصفًا وسعرًا أكبر من صفر لكل بند');
      return;
    }
    const original = transactions.find((t) => t.id === editor.id),
      t: Transaction = {
        id: editor.id || uid(),
        customer: selected,
        type: editor.type,
        items,
        amount,
        date: original?.date || new Date().toISOString(),
      },
      next = editor.id
        ? transactions.map((x) => (x.id === t.id ? t : x))
        : [...transactions, t];
    if (!validLedger(next.filter((x) => x.customer === selected))) {
      setError(
        'المبلغ يجعل التسديد أكبر من الدين المتاح. راجع المبلغ والمعاملات اللاحقة.',
      );
      return;
    }
    setTransactions(next);
    setEditor(null);
    notify('تم حفظ المعاملة وتحديث الرصيد');
  }
  function deleteTransaction(t: Transaction) {
    const next = transactions.filter((x) => x.id !== t.id);
    if (!validLedger(next.filter((x) => x.customer === t.customer))) {
      notify(
        'لا يمكن حذف هذا الدين لوجود تسديد مرتبط بالرصيد. عدّل التسديد أولًا.',
      );
      return;
    }
    setConfirm({
      text: 'حذف المعاملة وإعادة حساب رصيد الزبون؟',
      action: () => {
        setTransactions(next);
        notify('تم حذف المعاملة وتحديث الرصيد');
      },
    });
  }
  function share(t: Transaction) {
    if (!customer) return;
    const text = `مجمع الهبهاب\nالزبون: ${customer.name}\n${t.type === 'debt' ? 'دين' : 'تسديد'} • ${new Date(t.date).toLocaleDateString('ar-IQ')}\n${t.items.map((i) => `${i.name}: ${money(i.price)} د.ع`).join('\n')}\nالمبلغ: ${money(t.amount)} د.ع\nالدين المتبقي: ${money(debt)} د.ع`;
    window.open(
      `https://wa.me/${phoneNumber(customer.phone)}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }
  const empty = (
    icon: ReactNode,
    title: string,
    desc: string,
    action?: ReactNode,
  ) => (
    <div className="empty">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{desc}</p>
      {action}
    </div>
  );
  const addCustomer = (
    <button
      className="primary"
      onClick={() =>
        openForm({ kind: 'customer', name: '', phone: '', notes: '' })
      }
    >
      <Plus size={18} /> إضافة زبون
    </button>
  );
  const searchBox = (
    <div className="search">
      <Search size={20} />
      <input
        aria-label="البحث عن زبون"
        placeholder="ابحث عن زبون من أول حرف…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {search && (
        <IconButton label="مسح البحث" onClick={() => setSearch('')}>
          <X size={16} />
        </IconButton>
      )}
    </div>
  );
  const customerCards = (sale = false) => (
    <div className="cards">
      {filtered.map((c, index) => (
        <article className="customer-card" key={c.id}>
          <button
            className="customer-main"
            onClick={() => {
              setSelected(c.id);
              setTab('sales');
              setSearch('');
            }}
          >
            <span className={'avatar tone-' + (index % 3)}>
              {c.name.slice(0, 1)}
            </span>
            <span className="customer-info">
              <strong>{c.name}</strong>
              <span>
                <Phone size={13} />
                <bdi>{c.phone}</bdi>
              </span>
              {c.notes && <small>{c.notes}</small>}
            </span>
            <span className="customer-amount">
              <b>
                {money(
                  balance(transactions.filter((t) => t.customer === c.id)),
                )}
              </b>
              <small>دينار عراقي</small>
            </span>
            {sale && <ChevronLeft size={18} />}
          </button>
          {!sale && (
            <div className="card-bottom">
              <span
                className={
                  balance(transactions.filter((t) => t.customer === c.id))
                    ? 'badge amber'
                    : 'badge green'
                }
              >
                {balance(transactions.filter((t) => t.customer === c.id))
                  ? 'عليه دين'
                  : 'الحساب مسدّد'}
              </span>
              <div className="actions">
                <IconButton
                  label={`تعديل ${c.name}`}
                  onClick={() => openForm({ kind: 'customer', ...c })}
                >
                  <Pencil size={17} />
                </IconButton>
                <IconButton
                  label={`حذف ${c.name}`}
                  kind="danger"
                  onClick={() => deleteCustomer(c)}
                >
                  <Trash2 size={17} />
                </IconButton>
              </div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-icon">
            <Building2 size={27} />
          </span>
          <div>
            <h1>مجمع الهبهاب</h1>
            <p>للـمـواد الإنـشـائـيـة</p>
          </div>
        </div>
        <span className="header-label">
          <span /> دفتر الديون
        </span>
      </header>
      <main>
        <div className="preview-note">
          <span /> معاينة مؤقتة · تُمسح البيانات عند تحديث الصفحة
        </div>
        <Tabs value={tab} onValueChange={changeTab}>
          <TabsContent value="customers">
            <section className="summary">
              <div>
                <span className="eyebrow">حساباتك، بوضوح</span>
                <h2>كل زبائنك في مكان واحد</h2>
                <p>سجّل حساباتهم وتابع ديونهم بسهولة.</p>
              </div>
              <div className="summary-stats">
                <div>
                  <span>إجمالي الديون</span>
                  <strong>
                    {money(balance(transactions))} <small>د.ع</small>
                  </strong>
                </div>
                <div>
                  <span>عدد الزبائن</span>
                  <strong>
                    {money(customers.length)} <small>زبون</small>
                  </strong>
                </div>
              </div>
              <Wallet className="summary-art" />
            </section>
            <div className="section-heading">
              <div>
                <h2>
                  الزبائن <span className="count">{customers.length}</span>
                </h2>
                <p>إدارة الزبائن ومتابعة الحسابات</p>
              </div>
              {addCustomer}
            </div>
            {searchBox}
            {filtered.length
              ? customerCards()
              : empty(
                  <Users size={32} />,
                  search ? 'لا توجد نتائج' : 'أول زبون، بداية مرتّبة',
                  search
                    ? 'جرّب كتابة بداية اسم آخر.'
                    : 'أضف اسم الزبون ورقم واتسابه، وابدأ بتسجيل حسابه.',
                  !search ? addCustomer : undefined,
                )}
          </TabsContent>
          <TabsContent value="inventory">
            <div className="section-heading">
              <div>
                <span className="eyebrow blue">كل شيء في مكانه</span>
                <h2>{manage ? 'تصنيفات المخزون' : 'المخزون'}</h2>
                <p>
                  {manage
                    ? 'نظّم المواد في تصنيفات واضحة'
                    : 'المواد والأسعار والكميات المتوفرة'}
                </p>
              </div>
              <button className="soft" onClick={() => setManage(!manage)}>
                {manage ? <ArrowRight size={18} /> : <Layers size={18} />}{' '}
                {manage ? 'المخزون' : 'التصنيفات'}
              </button>
            </div>
            {manage ? (
              <>
                <button
                  className="primary"
                  onClick={() => openForm({ kind: 'category', name: '' })}
                >
                  <Plus size={18} /> إضافة تصنيف جديد
                </button>
                <div className="cards spaced">
                  {categories.map((c) => (
                    <article className="category-card" key={c.id}>
                      <span className="avatar">
                        <Layers />
                      </span>
                      <div>
                        <strong>{c.name}</strong>
                        <p>
                          {products.filter((p) => p.category === c.id).length}{' '}
                          مادة
                        </p>
                      </div>
                      <div className="actions">
                        <IconButton
                          label={`تعديل ${c.name}`}
                          onClick={() => openForm({ kind: 'category', ...c })}
                        >
                          <Pencil size={17} />
                        </IconButton>
                        <IconButton
                          label={`حذف ${c.name}`}
                          kind="danger"
                          onClick={() => {
                            if (products.some((p) => p.category === c.id)) {
                              notify(
                                'انقل مواد التصنيف أو احذفها قبل حذف التصنيف',
                              );
                              return;
                            }
                            setConfirm({
                              text: `حذف تصنيف «${c.name}»؟`,
                              action: () => {
                                setCategories((old) =>
                                  old.filter((x) => x.id !== c.id),
                                );
                                setCategory('all');
                              },
                            });
                          }}
                        >
                          <Trash2 size={17} />
                        </IconButton>
                      </div>
                    </article>
                  ))}
                </div>
                {!categories.length &&
                  empty(
                    <Layers size={32} />,
                    'أنشئ تصنيفك الأول',
                    'مثل السباكة، الكهرباء أو مواد البناء.',
                  )}
              </>
            ) : (
              <>
                <div className="inventory-toolbar">
                  <div className="chips">
                    <button
                      className={category === 'all' ? 'active' : ''}
                      onClick={() => setCategory('all')}
                    >
                      كل المواد <span>{products.length}</span>
                    </button>
                    {categories.map((c) => (
                      <button
                        className={category === c.id ? 'active' : ''}
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                  <button
                    className="primary"
                    onClick={() => {
                      if (!categories.length) {
                        setManage(true);
                        openForm({ kind: 'category', name: '' });
                        return;
                      }
                      openForm({
                        kind: 'product',
                        name: '',
                        buy: '',
                        sell: '',
                        quantity: '',
                        alert: '',
                        category:
                          category === 'all' ? categories[0].id : category,
                      });
                    }}
                  >
                    <Plus size={18} /> إضافة مادة
                  </button>
                </div>
                <div className="cards spaced">
                  {products
                    .filter(
                      (p) => category === 'all' || p.category === category,
                    )
                    .map((p) => (
                      <article key={p.id} className="product-card">
                        <div className="product-title">
                          <span className="avatar">
                            <Package size={23} />
                          </span>
                          <div>
                            <h3>{p.name}</h3>
                            <small>
                              {
                                categories.find((c) => c.id === p.category)
                                  ?.name
                              }
                            </small>
                          </div>
                          <div className="actions">
                            <IconButton
                              label={`تعديل ${p.name}`}
                              onClick={() =>
                                openForm({
                                  kind: 'product',
                                  ...p,
                                  buy: String(p.buy),
                                  sell: String(p.sell),
                                  quantity: String(p.quantity),
                                  alert: String(p.alert),
                                })
                              }
                            >
                              <Pencil size={17} />
                            </IconButton>
                            <IconButton
                              label={`حذف ${p.name}`}
                              kind="danger"
                              onClick={() =>
                                setConfirm({
                                  text: `حذف مادة «${p.name}»؟`,
                                  action: () =>
                                    setProducts((old) =>
                                      old.filter((x) => x.id !== p.id),
                                    ),
                                })
                              }
                            >
                              <Trash2 size={17} />
                            </IconButton>
                          </div>
                        </div>
                        <div className="prices">
                          <div>
                            <span>سعر الشراء</span>
                            <b>
                              {money(p.buy)} <small>د.ع</small>
                            </b>
                          </div>
                          <div>
                            <span>سعر البيع</span>
                            <b className="blue">
                              {money(p.sell)} <small>د.ع</small>
                            </b>
                          </div>
                        </div>
                        <div className="card-bottom">
                          <span>
                            الكمية: <b>{money(p.quantity)}</b>
                          </span>
                          <span
                            className={
                              'badge ' +
                              (p.quantity <= p.alert ? 'amber' : 'green')
                            }
                          >
                            {p.quantity === 0
                              ? 'نفدت الكمية'
                              : p.quantity <= p.alert
                                ? 'الكمية منخفضة'
                                : 'متوفر'}
                          </span>
                        </div>
                      </article>
                    ))}
                </div>
                {!products.filter(
                  (p) => category === 'all' || p.category === category,
                ).length &&
                  empty(
                    <Package size={32} />,
                    'مخزونك يبدأ من هنا',
                    'أنشئ تصنيفًا، ثم أضف المواد وأسعارها وكمياتها.',
                    <button
                      className="soft"
                      onClick={() => {
                        setManage(true);
                        openForm({ kind: 'category', name: '' });
                      }}
                    >
                      <Plus size={18} /> إنشاء تصنيف جديد
                    </button>,
                  )}
              </>
            )}
          </TabsContent>
          <TabsContent value="sales">
            {!customer ? (
              <>
                <div className="section-heading">
                  <div>
                    <span className="eyebrow blue">بيع وتسديد</span>
                    <h2>حساب الزبون</h2>
                    <p>اختر زبونًا لتسجيل دين أو تسديد</p>
                  </div>
                  <span className="avatar">
                    <ReceiptText />
                  </span>
                </div>
                {searchBox}
                {filtered.length
                  ? customerCards(true)
                  : empty(
                      <Users size={32} />,
                      search ? 'لا توجد نتائج' : 'لا يوجد زبائن بعد',
                      'أضف زبونًا لبدء تسجيل الديون والتسديدات.',
                      addCustomer,
                    )}
              </>
            ) : (
              <>
                <button
                  className="back"
                  onClick={() => {
                    if (editor) setEditor(null);
                    else setSelected(null);
                    setError('');
                  }}
                >
                  <ArrowRight size={19} />
                  {editor ? 'رجوع إلى الحساب' : 'كل الزبائن'}
                </button>
                <div className="account-heading">
                  <span className="avatar">{customer.name[0]}</span>
                  <div>
                    <h2>{customer.name}</h2>
                    <p>
                      <bdi>{customer.phone}</bdi>
                    </p>
                  </div>
                  <span className="badge">حساب الزبون</span>
                </div>
                <section className="balance">
                  <span>الدين الكلي</span>
                  <strong>
                    {money(debt)} <small>دينار عراقي</small>
                  </strong>
                  <span className="balance-label">
                    <span />{' '}
                    {debt ? 'الرصيد المستحق حاليًا' : 'الحساب مسدّد بالكامل'}
                  </span>
                  <Wallet className="balance-art" />
                </section>
                {editor ? (
                  <form className="transaction-form" onSubmit={saveTransaction}>
                    <div className="section-heading">
                      <div>
                        <h2>
                          {editor.id
                            ? 'تعديل المعاملة'
                            : editor.type === 'debt'
                              ? 'إضافة دين جديد'
                              : 'تسجيل تسديد'}
                        </h2>
                        <p>
                          {editor.type === 'debt'
                            ? 'أضف البنود، وسنجمعها في معاملة واحدة'
                            : 'أدخل المبلغ المستلم من الزبون'}
                        </p>
                      </div>
                    </div>
                    {editor.type === 'debt' ? (
                      <>
                        <div className="line-items">
                          {editor.items.map((item, i) => (
                            <div className="line-item" key={i}>
                              <span className="line-number">{i + 1}</span>
                              <label>
                                وصف البند
                                <input
                                  required
                                  maxLength={150}
                                  placeholder="مثل: حنفية"
                                  value={item.name}
                                  onChange={(e) =>
                                    setEditor({
                                      ...editor,
                                      items: editor.items.map((x, n) =>
                                        n === i
                                          ? { ...x, name: e.target.value }
                                          : x,
                                      ),
                                    })
                                  }
                                />
                              </label>
                              <Num
                                label="السعر (د.ع)"
                                value={item.price}
                                onChange={(v) =>
                                  setEditor({
                                    ...editor,
                                    items: editor.items.map((x, n) =>
                                      n === i ? { ...x, price: v } : x,
                                    ),
                                  })
                                }
                              />
                              {editor.items.length > 1 && (
                                <IconButton
                                  label={`حذف البند ${i + 1}`}
                                  kind="danger"
                                  onClick={() =>
                                    setEditor({
                                      ...editor,
                                      items: editor.items.filter(
                                        (_, n) => n !== i,
                                      ),
                                    })
                                  }
                                >
                                  <Trash2 size={17} />
                                </IconButton>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="add-line"
                          onClick={() =>
                            setEditor({
                              ...editor,
                              items: [...editor.items, { name: '', price: '' }],
                            })
                          }
                        >
                          <Plus size={19} /> إضافة حقل
                        </button>
                        <div className="total-row">
                          <span>مجموع المعاملة</span>
                          <b>
                            {money(
                              editor.items.reduce(
                                (n, i) => n + Number(i.price),
                                0,
                              ),
                            )}{' '}
                            <small>د.ع</small>
                          </b>
                        </div>
                      </>
                    ) : (
                      <>
                        <Num
                          label="مبلغ التسديد (د.ع)"
                          value={editor.amount}
                          onChange={(v) => setEditor({ ...editor, amount: v })}
                        />
                        <div className="total-row">
                          <span>الدين بعد التسديد</span>
                          <b>
                            {money(
                              debt +
                                (editor.id
                                  ? transactions.find((t) => t.id === editor.id)
                                      ?.amount || 0
                                  : 0) -
                                Number(editor.amount),
                            )}{' '}
                            <small>د.ع</small>
                          </b>
                        </div>
                      </>
                    )}
                    {error && (
                      <p role="alert" className="error">
                        {error}
                      </p>
                    )}
                    <button className="primary save" type="submit">
                      <Check size={19} /> حفظ المعاملة
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="account-actions">
                      <button
                        className="primary"
                        onClick={() => startTransaction('debt')}
                      >
                        <Plus size={20} /> إضافة دين
                      </button>
                      <button
                        className="payment-btn"
                        disabled={!debt}
                        onClick={() => startTransaction('payment')}
                      >
                        <ArrowDownLeft size={20} /> تسديد
                      </button>
                    </div>
                    <div className="section-heading">
                      <h2>
                        المعاملات <span className="count">{ledger.length}</span>
                      </h2>
                      <span className="muted">الأحدث أولًا</span>
                    </div>
                    <div className="transactions">
                      {[...ledger].reverse().map((t) => (
                        <article className="transaction-card" key={t.id}>
                          <div className="transaction-head">
                            <span
                              className={
                                'avatar ' + (t.type === 'payment' ? 'paid' : '')
                              }
                            >
                              {t.type === 'debt' ? (
                                <ReceiptText size={22} />
                              ) : (
                                <ArrowDownLeft size={22} />
                              )}
                            </span>
                            <div>
                              <h3>
                                {t.type === 'debt' ? 'إضافة دين' : 'تسديد مبلغ'}
                              </h3>
                              <small>
                                {new Date(t.date).toLocaleDateString('ar-IQ')} ·{' '}
                                {new Date(t.date).toLocaleTimeString('ar-IQ', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </small>
                            </div>
                            <b
                              className={
                                t.type === 'payment' ? 'green-text' : ''
                              }
                            >
                              {t.type === 'payment' ? '−' : '+'}
                              {money(t.amount)} <small>د.ع</small>
                            </b>
                          </div>
                          {t.items.length > 0 && (
                            <div className="transaction-items">
                              {t.items.map((item, i) => (
                                <div key={i}>
                                  <span>{item.name}</span>
                                  <span>{money(item.price)} د.ع</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="card-bottom">
                            <span
                              className={
                                'badge ' +
                                (t.type === 'debt' ? 'amber' : 'green')
                              }
                            >
                              {t.type === 'debt'
                                ? `${t.items.length} بنود`
                                : 'تم التسديد'}
                            </span>
                            <div className="actions">
                              <IconButton
                                label="مشاركة عبر واتساب"
                                kind="whatsapp"
                                onClick={() => share(t)}
                              >
                                <WhatsApp />
                              </IconButton>
                              <IconButton
                                label="تعديل المعاملة"
                                onClick={() => startTransaction(t.type, t)}
                              >
                                <Pencil size={17} />
                              </IconButton>
                              <IconButton
                                label="حذف المعاملة"
                                kind="danger"
                                onClick={() => deleteTransaction(t)}
                              >
                                <Trash2 size={17} />
                              </IconButton>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                    {!ledger.length &&
                      empty(
                        <ReceiptText size={32} />,
                        'صفحة جديدة، حساب واضح',
                        'سجّل أول دين وستظهر معاملاته هنا.',
                      )}
                  </>
                )}
              </>
            )}
          </TabsContent>
          <TabsList className="bottom-tabs">
            <TabsTrigger value="customers">
              <Users />
              <span>الزبائن</span>
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Package />
              <span>المخزون</span>
            </TabsTrigger>
            <TabsTrigger value="sales">
              <Wallet />
              <span>البيع</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </main>
      {notice && (
        <output className="notice">
          <Check size={19} />
          <span>{notice}</span>
          <IconButton label="إغلاق التنبيه" onClick={() => setNotice('')}>
            <X size={17} />
          </IconButton>
        </output>
      )}
      <Dialog
        open={!!form}
        onOpenChange={(v) => {
          if (!v) setForm(null);
        }}
      >
        <DialogContent className="edit-dialog" dir="rtl">
          <DialogTitle>
            {form?.id ? 'تعديل' : 'إضافة'}{' '}
            {form?.kind === 'customer'
              ? 'زبون'
              : form?.kind === 'category'
                ? 'تصنيف جديد'
                : 'مادة'}
          </DialogTitle>
          <DialogDescription>أدخل التفاصيل ثم اضغط حفظ.</DialogDescription>
          {form && (
            <form onSubmit={saveForm} className="edit-form">
              <label>
                {form.kind === 'product'
                  ? 'اسم المادة'
                  : form.kind === 'category'
                    ? 'اسم التصنيف'
                    : 'الاسم'}
                <input
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={
                    form.kind === 'category' ? 'اكتب اسم التصنيف' : 'اكتب الاسم'
                  }
                />
              </label>
              {form.kind === 'customer' && (
                <>
                  <label>
                    رقم الواتساب
                    <input
                      required
                      inputMode="tel"
                      dir="ltr"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      maxLength={25}
                      placeholder="07xx xxx xxxx"
                    />
                  </label>
                  <label>
                    ملاحظات <small>(اختياري)</small>
                    <textarea
                      maxLength={500}
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      placeholder="أي تفاصيل إضافية عن الزبون"
                    />
                  </label>
                </>
              )}
              {form.kind === 'product' && (
                <>
                  <div className="form-grid">
                    <Num
                      label="سعر الشراء (د.ع)"
                      value={form.buy || ''}
                      onChange={(v) => setForm({ ...form, buy: v })}
                    />
                    <Num
                      label="سعر البيع (د.ع)"
                      value={form.sell || ''}
                      onChange={(v) => setForm({ ...form, sell: v })}
                    />
                    <Num
                      label="الكمية"
                      value={form.quantity || ''}
                      onChange={(v) => setForm({ ...form, quantity: v })}
                    />
                    <Num
                      label="تنبيه عند بلوغ العدد"
                      value={form.alert || ''}
                      onChange={(v) => setForm({ ...form, alert: v })}
                    />
                  </div>
                  <div className="select-field">
                    <span id="category-label">التصنيف</span>
                    <Select
                      value={form.category || null}
                      onValueChange={(v) =>
                        setForm({ ...form, category: String(v || '') })
                      }
                    >
                      <SelectTrigger
                        aria-labelledby="category-label"
                        style={{ width: '100%', height: 46 }}
                      >
                        <SelectValue>
                          {categories.find((c) => c.id === form.category)
                            ?.name || 'اختر التصنيف'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              <button type="submit" className="primary save">
                <Check size={19} /> حفظ
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!confirm}
        onOpenChange={(v) => {
          if (!v) setConfirm(null);
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
          <AlertDialogDescription>{confirm?.text}</AlertDialogDescription>
          <div className="account-actions">
            <button
              className="delete-btn"
              onClick={() => {
                confirm?.action();
                setConfirm(null);
              }}
            >
              نعم، حذف
            </button>
            <button className="soft" onClick={() => setConfirm(null)}>
              إلغاء
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
