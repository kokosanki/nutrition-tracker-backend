import { Router, Request, Response } from "express";

const router = Router();

interface OffNutriments {
  "energy-kcal_100g"?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
}

interface OffProduct {
  product_name?: string;
  code?: string;
  serving_size?: string;
  nutriments?: OffNutriments;
}

interface OffSearchResponse {
  products: OffProduct[];
}

router.get("/search", async (req: Request, res: Response) => {
  try {
    const query = req.query.q;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const requestedPageSize = Number(req.query.limit);
    const pageSize =
      Number.isInteger(requestedPageSize) && requestedPageSize > 0
        ? Math.min(requestedPageSize, 100)
        : 20;

    const offBaseUrl = process.env.OFF_API_URL;
    const url = `${offBaseUrl}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=${pageSize}&sort_by=unique_scans_n`;

    const response = await fetch(url, {
      headers: {
        Authorization: "Basic " + Buffer.from("off:off").toString("base64"),
      },
    });
    const data = (await response.json()) as OffSearchResponse;

    const results = data.products.map((p) => {
      console.log("p", p);
      return {
        name: p.product_name,
        offId: p.code,
        serving: p.serving_size ?? null,
        caloriesPer100g: p.nutriments?.["energy-kcal_100g"] ?? null,
        proteinPer100g: p.nutriments?.proteins_100g ?? null,
        carbsPer100g: p.nutriments?.carbohydrates_100g ?? null,
        fatPer100g: p.nutriments?.fat_100g ?? null,
      };
    });

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong searching foods" });
  }
});

export default router;
