use std::env;
use std::path::Path;
use std::process;
use terrafusion_import::core::importer::{Importer, ImportEngine};
use terrafusion_import::formats::sqlite::SqliteImporter;

fn main() {
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 2 {
        eprintln!("Usage: {} <input_file> [output_file]", args[0]);
        eprintln!("Supported formats: SQLite (.sqlite, .db, .sqlite3)");
        process::exit(1);
    }
    
    let input_path = Path::new(&args[1]);
    let output_path = args.get(2).map(|s| Path::new(s));
    
    if !input_path.exists() {
        eprintln!("Error: Input file '{}' does not exist", input_path.display());
        process::exit(1);
    }
    
    println!("TerraFusion Import Engine v0.1.0");
    println!("Processing: {}", input_path.display());
    
    let start_time = std::time::Instant::now();
    
    match ImportEngine::auto_detect_and_import(input_path) {
        Ok(comps) => {
            let duration = start_time.elapsed();
            println!("✓ Successfully imported {} records in {:?}", comps.len(), duration);
            
            if let Some(output) = output_path {
                match ImportEngine::export_to_file(&comps, output) {
                    Ok(_) => println!("✓ Results exported to: {}", output.display()),
                    Err(e) => {
                        eprintln!("Error exporting results: {}", e);
                        process::exit(1);
                    }
                }
            } else {
                match ImportEngine::export_to_json(&comps) {
                    Ok(json) => println!("{}", json),
                    Err(e) => {
                        eprintln!("Error serializing results: {}", e);
                        process::exit(1);
                    }
                }
            }
        }
        Err(e) => {
            eprintln!("Import failed: {}", e);
            process::exit(1);
        }
    }
}