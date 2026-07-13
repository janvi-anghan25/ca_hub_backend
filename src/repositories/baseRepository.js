class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, options = {}) {
    const query = this.model.findById(id);
    if (options.populate) query.populate(options.populate);
    if (options.select) query.select(options.select);
    return query.lean(options.lean !== false);
  }

  async findOne(filter = {}, options = {}) {
    const query = this.model.findOne(filter);
    if (options.populate) query.populate(options.populate);
    if (options.select) query.select(options.select);
    return query.lean(options.lean !== false);
  }

  async find(filter = {}, options = {}) {
    const {
      sort = { createdAt: -1 },
      page = 1,
      limit = 10,
      populate,
      select,
      lean = true,
    } = options;

    const skip = (Number(page) - 1) * Number(limit);
    const query = this.model.find(filter).sort(sort).skip(skip).limit(Number(limit));

    if (populate) query.populate(populate);
    if (select) query.select(select);
    if (lean) query.lean();

    const [data, total] = await Promise.all([query, this.model.countDocuments(filter)]);
    return { data, total };
  }

  async findAll(filter = {}, options = {}) {
    const query = this.model.find(filter).sort(options.sort || { createdAt: -1 });
    if (options.populate) query.populate(options.populate);
    if (options.select) query.select(options.select);
    return query.lean();
  }

  async create(data) {
    const doc = new this.model(data);
    return doc.save();
  }

  async updateById(id, data, options = { new: true, runValidators: true }) {
    return this.model.findByIdAndUpdate(id, data, options).lean();
  }

  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async aggregate(pipeline) {
    return this.model.aggregate(pipeline);
  }

  async exists(filter) {
    return this.model.exists(filter);
  }
}

export default BaseRepository;
