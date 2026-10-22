import { randomUUID } from 'node:crypto';
import { query } from './db.js';

const definitions = {
  Assignment: {
    fields: {
      service_id: 'string', service_title: 'string', service_date: 'string',
      start_time: 'string', end_time: 'string', member_id: 'string',
      member_name: 'string', team: 'string', position: 'string',
      status: 'string', notes: 'string',
    },
    required: ['service_id', 'member_id'],
    defaults: { team: 'band', status: 'pending' },
  },
  Availability: {
    fields: {
      member_id: 'string', member_name: 'string', date: 'string',
      availability: 'string', from_time: 'string', to_time: 'string', note: 'string',
    },
    required: ['member_id', 'date'],
    defaults: { availability: 'available' },
  },
  Service: {
    fields: {
      title: 'string', service_date: 'string', start_time: 'string',
      end_time: 'string', service_type: 'string', location: 'string',
      status: 'string', notes: 'string',
    },
    required: ['title', 'service_date', 'start_time', 'end_time'],
    defaults: { service_type: 'sunday_morning', status: 'draft' },
  },
  ServiceTime: {
    fields: {
      label: 'string', day_of_week: 'string', time: 'string',
      end_time: 'string', description: 'string', location: 'string', is_active: 'boolean',
    },
    required: ['label', 'day_of_week', 'time'],
    defaults: { is_active: true },
  },
  Setlist: {
    fields: {
      title: 'string', service_id: 'string', service_title: 'string',
      service_date: 'string', is_published: 'boolean', notes: 'string', items: 'array',
    },
    required: ['title'],
    defaults: { is_published: false, items: [] },
  },
  SignupInterest: {
    fields: {
      full_name: 'string', email: 'string', phone: 'string', teams: 'array',
      experience: 'string', message: 'string', status: 'string',
    },
    required: ['full_name', 'email'],
    defaults: { status: 'new', teams: [] },
  },
  Song: {
    fields: {
      title: 'string', artist: 'string', song_key: 'string', tempo: 'number',
      ccli_number: 'string', themes: 'array', youtube_url: 'string', notes: 'string',
    },
    required: ['title'],
    defaults: { themes: [] },
  },
  SwapRequest: {
    fields: {
      assignment_id: 'string', service_id: 'string', service_title: 'string',
      service_date: 'string', position: 'string', assigned_member_id: 'string',
      assigned_member_name: 'string', requested_by: 'string', reason: 'string',
      suggested_member_id: 'string', suggested_member_name: 'string',
      status: 'string', resolution_note: 'string',
    },
    required: ['assignment_id'],
    defaults: { status: 'open' },
  },
  TeamMember: {
    fields: {
      full_name: 'string', email: 'string', phone: 'string', role: 'string',
      instrument: 'string', voice_part: 'string', is_active: 'boolean', notes: 'string',
    },
    required: ['full_name'],
    defaults: { role: 'musician', is_active: true },
  },
};

const enumValues = {
  Assignment: {
    team: ['worship_leader', 'vocals', 'band', 'media', 'sound', 'lighting', 'other'],
    status: ['pending', 'confirmed', 'declined'],
  },
  Availability: { availability: ['available', 'unavailable'] },
  Service: {
    service_type: ['sunday_morning', 'sunday_evening', 'midweek', 'rehearsal', 'special_event'],
    status: ['draft', 'confirmed', 'completed'],
  },
  ServiceTime: {
    day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  SignupInterest: { status: ['new', 'contacted', 'joined', 'declined'] },
  SwapRequest: { status: ['open', 'approved', 'declined'] },
  TeamMember: {
    role: ['worship_leader', 'vocalist', 'musician', 'media', 'sound', 'lighting', 'other'],
  },
};

const publicReads = new Set(['Service', 'ServiceTime', 'Setlist', 'Song', 'Assignment']);

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw validationError(`${label} must be an object.`);
  }
}

function validateData(entity, data, partial = false) {
  const definition = definitions[entity];
  assertObject(data, 'Record');
  for (const key of Object.keys(data)) {
    if (!Object.hasOwn(definition.fields, key)) {
      throw validationError(`Unsupported ${entity} field: ${key}`);
    }
    const type = definition.fields[key];
    if (type === 'array') {
      if (!Array.isArray(data[key]) || data[key].length > 500) {
        throw validationError(`${key} must be an array with at most 500 items.`);
      }
    } else if (type === 'number') {
      if (typeof data[key] !== 'number' || !Number.isFinite(data[key])) {
        throw validationError(`${key} must be a finite number.`);
      }
    } else if (typeof data[key] !== type) {
      throw validationError(`${key} must be a ${type}.`);
    }
    const allowed = enumValues[entity]?.[key];
    if (allowed && !allowed.includes(data[key])) {
      throw validationError(`${key} has an unsupported value.`);
    }
    if (type === 'string' && data[key].length > 2000) {
      throw validationError(`${key} must be at most 2000 characters.`);
    }
    if (key === 'email' && data[key] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data[key])) {
      throw validationError('Enter a valid email address.');
    }
    if (entity === 'Setlist' && key === 'items') {
      for (const item of data.items) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          throw validationError('Each setlist item must be an object.');
        }
        const fields = ['song_id', 'title', 'song_key', 'sequence_notes'];
        if (Object.keys(item).some((field) => !fields.includes(field)) ||
            Object.values(item).some((value) => typeof value !== 'string')) {
          throw validationError('Setlist items contain unsupported fields or values.');
        }
      }
    }
  }
  if (!partial) {
    for (const field of definition.required) {
      if (typeof data[field] !== 'string' || !data[field].trim()) {
        throw validationError(`${field} is required.`);
      }
    }
  }
}

function filterValue(field, value, values, entity) {
  const definition = definitions[entity];
  if (field !== 'id' && !Object.hasOwn(definition.fields, field)) {
    throw validationError(`Unsupported ${entity} filter field: ${field}`);
  }

  if (field === 'id') return 'id::text';
  return `data ->> $${values.push(field)}`;
}

function assertId(id) {
  if (typeof id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw validationError('Record id must be a valid UUID.');
  }
}

function filterClauses(entity, field, filter, values) {
  const fieldRef = filterValue(field, filter, values, entity);
  const clauses = [];
  if (filter && typeof filter === 'object' && !Array.isArray(filter)) {
    for (const [operator, operand] of Object.entries(filter)) {
      if (operator === '$in') {
        if (!Array.isArray(operand) || operand.length > 500) {
          throw validationError(`${field} $in requires an array of at most 500 values.`);
        }
        const normalized = operand.map(String);
        clauses.push(`${fieldRef} = ANY($${values.push(normalized)}::text[])`);
      } else if (operator === '$regex') {
        if (typeof operand !== 'string' || operand.length > 100) {
          throw validationError(`${field} $regex must be a string of at most 100 characters.`);
        }
        clauses.push(`${fieldRef} ILIKE $${values.push(`%${operand}%`)}`);
      } else if (['$gte', '$gt', '$lte', '$lt'].includes(operator)) {
        const sqlOperator = { $gte: '>=', $gt: '>', $lte: '<=', $lt: '<' }[operator];
        clauses.push(`${fieldRef} ${sqlOperator} $${values.push(String(operand))}`);
      } else if (operator === '$options') {
        if (operand !== 'i' || !Object.hasOwn(filter, '$regex')) {
          throw validationError('$options only supports case-insensitive regular-expression search.');
        }
      } else {
        throw validationError(`Unsupported filter operator: ${operator}`);
      }
    }
  } else if (filter === null) {
    clauses.push(`${fieldRef} IS NULL`);
  } else {
    clauses.push(`${fieldRef} = $${values.push(String(filter))}`);
  }
  if (!clauses.length) throw validationError(`Filter for ${field} is empty.`);
  return clauses;
}

function filterExpression(entity, filters, values, depth = 0) {
  assertObject(filters || {}, 'Query');
  if (depth > 3) throw validationError('Query nesting is too deep.');
  const clauses = [];
  for (const [field, filter] of Object.entries(filters || {})) {
    if (field === '$or') {
      if (!Array.isArray(filter) || filter.length === 0 || filter.length > 10) {
        throw validationError('$or requires between 1 and 10 query objects.');
      }
      clauses.push(`(${filter.map((part) =>
        `(${filterExpression(entity, part, values, depth + 1)})`
      ).join(' OR ')})`);
    } else {
      clauses.push(...filterClauses(entity, field, filter, values));
    }
  }
  return clauses.length ? clauses.join(' AND ') : 'TRUE';
}

function whereClause(entity, filters, values) {
  const clauses = [`entity = $${values.push(entity)}`];
  clauses.push(filterExpression(entity, filters || {}, values));
  return clauses.join(' AND ');
}

function serialize(row) {
  return {
    ...row.data,
    id: row.id,
    created_date: row.created_at.toISOString(),
    updated_date: row.updated_at.toISOString(),
  };
}

function publicQuery(entity, queryFilters) {
  const filters = { ...(queryFilters || {}) };
  if (entity === 'ServiceTime') filters.is_active = true;
  if (entity === 'Service') {
    filters.service_date = { ...(filters.service_date || {}), $gte: new Date().toISOString().slice(0, 10) };
  }
  if (entity === 'Assignment') {
    filters.service_date = { ...(filters.service_date || {}), $gte: new Date().toISOString().slice(0, 10) };
  }
  if (entity === 'Setlist') filters.is_published = true;
  return filters;
}

function assertEntity(entity) {
  if (!Object.hasOwn(definitions, entity)) {
    const error = new Error('Unknown data collection.');
    error.status = 404;
    throw error;
  }
}

function requireAuth(user) {
  if (!user) {
    const error = new Error('Sign in is required to perform this action.');
    error.status = 401;
    throw error;
  }
}

export async function handleEntityRequest({ entity, operation, body, user }) {
  assertEntity(entity);
  const publicRead = !user && publicReads.has(entity) && ['filter', 'list'].includes(operation);
  if (!publicRead && !(entity === 'SignupInterest' && operation === 'create' && !user)) {
    requireAuth(user);
  }

  const filters = publicRead ? publicQuery(entity, body.query) : (body.query || {});
  if (operation === 'filter' || operation === 'list') {
    const values = [];
    const where = whereClause(entity, filters, values);
    const rawSort = body.options?.sort || '';
    const descending = rawSort.startsWith('-');
    const sortField = descending ? rawSort.slice(1) : rawSort;
    if (sortField && sortField !== 'id' && sortField !== 'created_date' &&
        !Object.hasOwn(definitions[entity].fields, sortField)) {
      throw validationError(`Unsupported sort field: ${sortField}`);
    }
    const sortColumn = sortField === 'id' ? 'id'
      : sortField === 'created_date' ? 'created_at'
      : sortField ? `(data ->> '${sortField}')` : 'created_at';
    const limit = Math.max(1, Math.min(Number(body.options?.limit) || 100, 500));
    const result = await query(
      `SELECT id, data, created_at, updated_at FROM app_records
       WHERE ${where}
       ORDER BY ${sortColumn} ${descending ? 'DESC' : 'ASC'} NULLS LAST
       LIMIT $${values.push(limit)}`,
      values
    );
    return { items: result.rows.map(serialize), count: result.rowCount };
  }

  if (operation === 'count') {
    requireAuth(user);
    const values = [];
    const where = whereClause(entity, body.query || {}, values);
    const result = await query(`SELECT count(*)::int AS count FROM app_records WHERE ${where}`, values);
    return result.rows[0].count;
  }

  if (operation === 'aggregate') {
    requireAuth(user);
    const groupBy = body.groupBy;
    if (!Object.hasOwn(definitions[entity].fields, groupBy)) {
      throw validationError(`Unsupported grouping field: ${groupBy}`);
    }
    const values = [];
    const where = whereClause(entity, body.query || {}, values);
    const fieldRef = `(data ->> '${groupBy}')`;
    const result = await query(
      `SELECT ${fieldRef} AS "${groupBy}", count(*)::int AS count
       FROM app_records WHERE ${where}
       GROUP BY ${fieldRef}`,
      values
    );
    return { rows: result.rows };
  }

  if (operation === 'get') {
    requireAuth(user);
    assertId(body.id);
    const result = await query(
      `SELECT id, data, created_at, updated_at FROM app_records
       WHERE entity = $1 AND id = $2`,
      [entity, body.id]
    );
    if (!result.rowCount) {
      const error = new Error('Record not found.');
      error.status = 404;
      throw error;
    }
    return serialize(result.rows[0]);
  }

  if (operation === 'create') {
    const data = { ...definitions[entity].defaults, ...body.data };
    if (entity === 'SignupInterest' && !user) data.status = 'new';
    validateData(entity, data);
    const result = await query(
      `INSERT INTO app_records (id, entity, data)
       VALUES ($1, $2, $3::jsonb)
       RETURNING id, data, created_at, updated_at`,
      [randomUUID(), entity, JSON.stringify(data)]
    );
    return serialize(result.rows[0]);
  }

  if (operation === 'update') {
    requireAuth(user);
    assertId(body.id);
    validateData(entity, body.data, true);
    const result = await query(
      `UPDATE app_records SET data = data || $3::jsonb, updated_at = now()
       WHERE entity = $1 AND id = $2
       RETURNING id, data, created_at, updated_at`,
      [entity, body.id, JSON.stringify(body.data)]
    );
    if (!result.rowCount) {
      const error = new Error('Record not found.');
      error.status = 404;
      throw error;
    }
    return serialize(result.rows[0]);
  }

  if (operation === 'delete') {
    requireAuth(user);
    assertId(body.id);
    const result = await query(
      `DELETE FROM app_records WHERE entity = $1 AND id = $2 RETURNING id`,
      [entity, body.id]
    );
    if (!result.rowCount) {
      const error = new Error('Record not found.');
      error.status = 404;
      throw error;
    }
    return { success: true };
  }

  const error = new Error('Unsupported data operation.');
  error.status = 404;
  throw error;
}
