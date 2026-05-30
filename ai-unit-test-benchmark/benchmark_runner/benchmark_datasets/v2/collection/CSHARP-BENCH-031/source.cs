public class CollectionService
{
    public List<int> RemoveDuplicates(List<int> values)
    {
        return values
            .Distinct()
            .ToList();
    }
}