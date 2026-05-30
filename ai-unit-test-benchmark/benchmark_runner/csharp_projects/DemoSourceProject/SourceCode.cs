
            namespace BenchmarkSourceProject;
            public class SourceService
            {
            [HttpGet]
    public IActionResult GetAll()
    {
        var data = _context.UserProfiles
            .OrderByDescending(x => x.Id)
            .ToList();

        return Ok(data);
    }
            }
            