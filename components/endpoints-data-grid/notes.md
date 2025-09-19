# EndpointsDataGrid refactor

- The `components/ui/data-grid*` components are sourced from ReUI, a shadcn/ui extension component library.
- While we want to keep these components somewhat generic and multipurpose, we can customise certain elements to better suit our needs and preferences.
- ChangesDataGrid also uses these components. We can refactor it if needed (and it will be refreshed later), but try to keep changes to the core components manageable.
- However some features it provides are highly unlikely to be used: pagination (we use infinite scroll), DnD
- Alternatively we can copy components and modify specific for this purpose where needed

## Out Of Scope (optimize later)

- Efficient data loading/transfer on load
- Rendering performance/virtualization

## Additions

- nuqs: query param state, source of truth
- break up pricing, limits, data policy where needed
- some key attributes become columns
- add important supported param attribute columns: tools, response_format, structured_outputs
- column visibility: controlled, could change based on setting (e.g. audio modality -> show pricing)

## Supporting Changes

- global app tooltip provider
- better data-grid -> data-grid-frame cohesion
- icon+tooltip badges

## Controls

- Sort headers

- Model/Provider filtering
  - fuzzy search
  - by selected model/provider
  - variant (primarily 'free' || 'paid' || '')
  - modalities
  - model

- column visibility

- extra visual options: cell borders, striped etc.

## Current Endpoint Data Analysis

Counts of records that include a value for optional fields.

```jsonc
{
  // single field, attribute
  "data_policy_fields": {
    "can_publish": { "count": 4, "percentage": 0.49 },
    "requires_user_ids": { "count": 52, "percentage": 6.41 },
    "retains_prompts": { "count": 399, "percentage": 49.2 },
    "retains_prompts_days": { "count": 96, "percentage": 11.84 },
    "training": { "count": 109, "percentage": 13.44 },
  },

  // attribute style, mixed locations
  "endpoint_capabilities": {
    "chat_completions": { "count": 807, "percentage": 99.51 }, // hidden
    "completions": { "count": 579, "percentage": 71.39 }, // hidden
    "deranked": { "count": 48, "percentage": 5.92 }, // near provider
    "disabled": { "count": 1, "percentage": 0.12 }, // near provider
    "file_urls": { "count": 32, "percentage": 3.95 }, // hidden
    "implicit_caching": { "count": 15, "percentage": 1.85 },
    "moderated": { "count": 76, "percentage": 9.37 }, // near provider
    "multipart": { "count": 714, "percentage": 88.04 }, // hidden
    "native_web_search": { "count": 16, "percentage": 1.97 },
    "stream_cancellation": { "count": 564, "percentage": 69.54 }, // hidden
  },

  // attributes, important
  "input_modalities": {
    "audio": { "count": 18, "percentage": 2.22 },
    "file": { "count": 76, "percentage": 9.37 },
    "image": { "count": 206, "percentage": 25.4 },
    "text": { "count": 811, "percentage": 100 },
  },
  "output_modalities": {
    "image": { "count": 2, "percentage": 0.25 },
    "text": { "count": 811, "percentage": 100 },
  },

  // warning icon?
  "limits_fields": {
    "image_input_tokens": { "count": 6, "percentage": 0.74 },
    "images_per_input": { "count": 9, "percentage": 1.11 },
    "requests_per_day": { "count": 2, "percentage": 0.25 },
    "requests_per_minute": { "count": 35, "percentage": 4.32 },
    "text_input_tokens": { "count": 25, "percentage": 3.08 },
    "text_output_tokens": { "count": 479, "percentage": 59.06 }, // own column
  },

  "model_capabilities": {
    "mandatory_reasoning": { "count": 51, "percentage": 6.29 },
    "reasoning": { "count": 281, "percentage": 34.65 }, // own column, near model
  },

  "other_fields": {
    "quantization": { "count": 479, "percentage": 59.06 }, // own column
    "unavailable_at": { "count": 12, "percentage": 1.48 }, // warning icon -> faded/hidden
  },

  // all own columns, show/hide based on context?
  "pricing_fields": {
    "audio_cache_input": { "count": 4, "percentage": 0.49 },
    "audio_input": { "count": 7, "percentage": 0.86 },
    "cache_read": { "count": 107, "percentage": 13.19 },
    "cache_write": { "count": 54, "percentage": 6.66 },
    "discount": { "count": 5, "percentage": 0.62 }, // integrate/inline with affected values?
    "image_input": { "count": 90, "percentage": 11.1 },
    "image_output": { "count": 2, "percentage": 0.25 },
    "internal_reasoning": { "count": 1, "percentage": 0.12 },
    "request": { "count": 4, "percentage": 0.49 },
    "text_input": { "count": 737, "percentage": 90.88 }, // own column
    "text_output": { "count": 737, "percentage": 90.88 }, // own column
    "web_search": { "count": 19, "percentage": 2.34 },
  },

  "total_endpoints": 811,
}
```

## Potential

- shadcn/ui Sheet
- expandable rows

### Attribute Group Columns

- We have a lot of optional boolean/numeric values which can be too rare to devote a column to normally, but are very important if present (e.g. request per min limit, image/audio pricing)
- We use groups of 'attribute' badges to present these concisely
- No logical way to sort these
- We could squash certain attributes even further by using brighly colored icon-only badges with tooltip

## Considerations/Future Enhancements

- We may build a more focused "Model" table later, many columns would be shared
- Change detection notifications (e.g. icon next to recently changed price)
