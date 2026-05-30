public class Product
{
    public List<string> Tags { get; set; } = new();
}

public class ProductService
{
    public List<string> FlattenTags(
        List<Product> products)
    {
        return products
            .SelectMany(x => x.Tags)
            .Distinct()
            .ToList();
    }
}