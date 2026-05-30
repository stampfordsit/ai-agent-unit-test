public interface IProductRepository
{
    Task<List<Product>> GetAllAsync();
}

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

public class ProductService
{
    private readonly IProductRepository _repo;

    public ProductService(IProductRepository repo)
    {
        _repo = repo;
    }

    public async Task<List<Product>> GetProductsAsync()
    {
        return await _repo.GetAllAsync();
    }
}