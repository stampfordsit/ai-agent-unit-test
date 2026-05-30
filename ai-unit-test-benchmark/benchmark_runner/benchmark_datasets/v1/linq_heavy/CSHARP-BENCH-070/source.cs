public class Product
{
    public string Category { get; set; } = "";
}

public class ProductService
{
    public Dictionary<string, int> CountByCategory(
        List<Product> products)
    {
        return products
            .GroupBy(x => x.Category)
            .ToDictionary(
                g => g.Key,
                g => g.Count());
    }
}