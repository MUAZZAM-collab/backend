import Enquiry from "../models/Enquiry.js";

const VALID_STATUSES = ["new", "read", "archived"];

// ---------- Public: create enquiry ----------
export async function createEnquiry(req, res, next) {
  try {
    const { name, email, phone = "", division, divisionTitle, message } = req.body;

    const record = await Enquiry.create({
      name,
      email,
      phone,
      division,
      divisionTitle: divisionTitle || division,
      message,
      ip: req.ip,
      userAgent: req.get("user-agent") || "",
    });

    return res.status(201).json({
      ok: true,
      id: record.id,
      reference: record.id.slice(-8).toUpperCase(),
    });
  } catch (err) {
    next(err);
  }
}

// ---------- Admin: list with filters + pagination ----------
export async function listEnquiries(req, res, next) {
  try {
    const { status, division, q, page = "1", limit = "50" } = req.query;

    const filter = {};
    if (status && VALID_STATUSES.includes(status)) filter.status = status;
    if (division) filter.division = division;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { message: { $regex: q, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [items, total, counts] = await Promise.all([
      Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Enquiry.countDocuments(filter),
      Enquiry.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const stats = { new: 0, read: 0, archived: 0 };
    for (const { _id, count } of counts) stats[_id] = count;

    res.json({
      ok: true,
      items,
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
      stats,
    });
  } catch (err) {
    next(err);
  }
}

// ---------- Admin: get one ----------
export async function getEnquiry(req, res, next) {
  try {
    const record = await Enquiry.findById(req.params.id);
    if (!record) return res.status(404).json({ error: "Enquiry not found" });
    res.json({ ok: true, enquiry: record });
  } catch (err) {
    next(err);
  }
}

// ---------- Admin: update status ----------
export async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const record = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true },
    );
    if (!record) return res.status(404).json({ error: "Enquiry not found" });
    res.json({ ok: true, enquiry: record });
  } catch (err) {
    next(err);
  }
}

// ---------- Admin: delete ----------
export async function deleteEnquiry(req, res, next) {
  try {
    const record = await Enquiry.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: "Enquiry not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}